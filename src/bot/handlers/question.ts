import { Context, InlineKeyboard } from "grammy";
import { questionManager } from "../../question/manager.js";
import { opencodeClient } from "../../opencode/client.js";
import { getCurrentProject } from "../../settings/manager.js";
import { getCurrentSession } from "../../session/manager.js";
import { summaryAggregator } from "../../summary/aggregator.js";
import { logger } from "../../utils/logger.js";
import { safeBackgroundTask } from "../../utils/safe-background-task.js";
import { t } from "../../i18n/index.js";

const MAX_BUTTON_LENGTH = 60;

export async function handleQuestionCallback(ctx: Context): Promise<boolean> {
  const data = ctx.callbackQuery?.data;
  if (!data) return false;

  if (!data.startsWith("question:")) {
    return false;
  }

  logger.debug(`[QuestionHandler] Received callback: ${data}`);

  if (!questionManager.isActive()) {
    await ctx.answerCallbackQuery({ text: t("question.inactive_callback"), show_alert: true });
    return true;
  }

  const parts = data.split(":");
  const action = parts[1];
  const questionIndex = parseInt(parts[2], 10);

  try {
    switch (action) {
      case "select":
        await handleSelectOption(ctx, questionIndex, parseInt(parts[3], 10));
        break;
      case "submit":
        await handleSubmitAnswer(ctx, questionIndex);
        break;
      case "custom":
        await handleCustomAnswer(ctx, questionIndex);
        break;
      case "cancel":
        await handleCancelPoll(ctx);
        break;
    }
  } catch (err) {
    logger.error("[QuestionHandler] Error handling callback:", err);
    await ctx.answerCallbackQuery({
      text: t("question.processing_error_callback"),
      show_alert: true,
    });
  }

  return true;
}

async function handleSelectOption(
  ctx: Context,
  questionIndex: number,
  optionIndex: number,
): Promise<void> {
  logger.debug(
    `[QuestionHandler] handleSelectOption: qIndex=${questionIndex}, oIndex=${optionIndex}`,
  );

  const question = questionManager.getCurrentQuestion();
  if (!question) {
    logger.debug("[QuestionHandler] No current question");
    return;
  }

  questionManager.selectOption(questionIndex, optionIndex);

  if (question.multiple) {
    logger.debug("[QuestionHandler] Multiple choice mode, updating message");
    await updateQuestionMessage(ctx);
    await ctx.answerCallbackQuery();
  } else {
    logger.debug("[QuestionHandler] Single choice mode, moving to next question");
    await ctx.answerCallbackQuery();

    const answer = questionManager.getSelectedAnswer(questionIndex);
    logger.debug(`[QuestionHandler] Selected answer for question ${questionIndex}: ${answer}`);

    // Delete the question message before showing the next one
    await ctx.deleteMessage().catch(() => {});

    // DO NOT send the answer immediately - move to the next question
    // All answers will be sent together after the user answers all questions
    await showNextQuestion(ctx);
  }
}

async function handleSubmitAnswer(ctx: Context, questionIndex: number): Promise<void> {
  const answer = questionManager.getSelectedAnswer(questionIndex);

  if (!answer) {
    await ctx.answerCallbackQuery({
      text: t("question.select_one_required_callback"),
      show_alert: true,
    });
    return;
  }

  logger.debug(`[QuestionHandler] Submit answer for question ${questionIndex}: ${answer}`);

  await ctx.answerCallbackQuery();

  // Delete the question message before showing the next one
  await ctx.deleteMessage().catch(() => {});

  // DO NOT send the answer immediately - move to the next question
  // All answers will be sent together after the user answers all questions
  await showNextQuestion(ctx);
}

async function handleCustomAnswer(ctx: Context, _questionIndex: number): Promise<void> {
  await ctx.answerCallbackQuery({
    text: t("question.enter_custom_callback"),
    show_alert: true,
  });
}

async function handleCancelPoll(ctx: Context): Promise<void> {
  questionManager.cancel();

  await ctx.editMessageText(t("question.cancelled"));
  await ctx.answerCallbackQuery();
}

async function updateQuestionMessage(ctx: Context): Promise<void> {
  const question = questionManager.getCurrentQuestion();
  if (!question) {
    logger.debug("[QuestionHandler] updateQuestionMessage: no current question");
    return;
  }

  const text = formatQuestionText(question);
  const keyboard = buildQuestionKeyboard(
    question,
    questionManager.getSelectedOptions(questionManager.getCurrentIndex()),
  );

  logger.debug("[QuestionHandler] Updating question message");

  try {
    await ctx.editMessageText(text, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  } catch (err) {
    logger.error("[QuestionHandler] Failed to update message:", err);
  }
}

export async function showCurrentQuestion(bot: Context["api"], chatId: number): Promise<void> {
  const question = questionManager.getCurrentQuestion();

  if (!question) {
    await showPollSummary(bot, chatId);
    return;
  }

  logger.debug(`[QuestionHandler] Showing question: ${question.header} - ${question.question}`);

  const text = formatQuestionText(question);
  const keyboard = buildQuestionKeyboard(
    question,
    questionManager.getSelectedOptions(questionManager.getCurrentIndex()),
  );

  logger.debug(`[QuestionHandler] Sending message with keyboard, chatId=${chatId}`);

  try {
    const message = await bot.sendMessage(chatId, text, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });

    logger.debug(`[QuestionHandler] Message sent, messageId=${message.message_id}`);

    questionManager.addMessageId(message.message_id);

    summaryAggregator.stopTypingIndicator();
  } catch (err) {
    logger.error("[QuestionHandler] Failed to send question message:", err);
    throw err;
  }
}

export async function handleQuestionTextAnswer(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  const currentIndex = questionManager.getCurrentIndex();

  if (questionManager.hasCustomAnswer(currentIndex)) {
    await ctx.reply(t("question.answer_already_received"));
    return;
  }

  logger.debug(`[QuestionHandler] Custom text answer for question ${currentIndex}: ${text}`);

  questionManager.setCustomAnswer(currentIndex, text);

  // Delete the previous question message
  const messageIds = questionManager.getMessageIds();
  if (messageIds.length > 0 && ctx.chat) {
    const lastMessageId = messageIds[messageIds.length - 1];
    await ctx.api.deleteMessage(ctx.chat.id, lastMessageId).catch(() => {});
  }

  // DO NOT send the answer immediately - move to the next question
  // All answers will be sent together after the user answers all questions
  await showNextQuestion(ctx);
}

async function showNextQuestion(ctx: Context): Promise<void> {
  questionManager.nextQuestion();

  if (!ctx.chat) {
    return;
  }

  if (questionManager.hasNextQuestion()) {
    await showCurrentQuestion(ctx.api, ctx.chat.id);
  } else {
    await showPollSummary(ctx.api, ctx.chat.id);
  }
}

async function showPollSummary(bot: Context["api"], chatId: number): Promise<void> {
  const answers = questionManager.getAllAnswers();
  const totalQuestions = questionManager.getTotalQuestions();

  logger.info(
    `[QuestionHandler] Poll completed: ${answers.length}/${totalQuestions} questions answered`,
  );

  // Send all answers to the OpenCode API
  await sendAllAnswersToAgent(bot, chatId);

  if (answers.length === 0) {
    await bot.sendMessage(chatId, t("question.completed_no_answers"));
  } else {
    const summary = formatAnswersSummary(answers);
    await bot.sendMessage(chatId, summary);
  }

  questionManager.clear();
  logger.debug("[QuestionHandler] Poll completed and cleared");
}

async function sendAllAnswersToAgent(bot: Context["api"], chatId: number): Promise<void> {
  const currentProject = getCurrentProject();
  const currentSession = getCurrentSession();
  const requestID = questionManager.getRequestID();
  const totalQuestions = questionManager.getTotalQuestions();
  const directory = currentSession?.directory ?? currentProject?.worktree;

  if (!directory) {
    logger.error("[QuestionHandler] No project for sending answers");
    await bot.sendMessage(chatId, t("question.no_active_project"));
    return;
  }

  if (!requestID) {
    logger.error("[QuestionHandler] No requestID for sending answers");
    await bot.sendMessage(chatId, t("question.no_active_request"));
    return;
  }

  // Collect answers for all questions
  // Format: Array<Array<string>> - for each question, an array of strings (selected options)
  const allAnswers: string[][] = [];

  for (let i = 0; i < totalQuestions; i++) {
    const customAnswer = questionManager.getCustomAnswer(i);
    const selectedAnswer = questionManager.getSelectedAnswer(i);

    // Priority: custom answer > selected options
    const answer = customAnswer || selectedAnswer || "";

    if (answer) {
      // Split by newlines if multiple options were selected (in multiple choice mode)
      // Each option is formatted as "* Label: Description"
      const answerParts = answer.split("\n").filter((part) => part.trim());
      allAnswers.push(answerParts);
    } else {
      // Empty answer for unanswered questions
      allAnswers.push([]);
    }
  }

  logger.info(
    `[QuestionHandler] Sending all ${totalQuestions} answers to agent via question.reply: requestID=${requestID}`,
  );
  logger.debug(`[QuestionHandler] Answers payload:`, JSON.stringify(allAnswers, null, 2));

  // CRITICAL: Fire-and-forget! Do not wait for question.reply to complete,
  // otherwise it may block subsequent updates
  safeBackgroundTask({
    taskName: "question.reply",
    task: () =>
      opencodeClient.question.reply({
        requestID,
        directory,
        answers: allAnswers,
      }),
    onSuccess: ({ error }) => {
      if (error) {
        logger.error("[QuestionHandler] Failed to send answers via question.reply:", error);
        void bot.sendMessage(chatId, t("question.send_answers_error")).catch(() => {});
        return;
      }

      logger.info("[QuestionHandler] All answers sent to agent successfully via question.reply");
    },
  });
}

function formatQuestionText(question: {
  header: string;
  question: string;
  multiple?: boolean;
}): string {
  const currentIndex = questionManager.getCurrentIndex();
  const totalQuestions = questionManager.getTotalQuestions();
  const progressText = totalQuestions > 0 ? `${currentIndex + 1}/${totalQuestions}` : "";

  const headerTitle = [progressText, question.header].filter(Boolean).join(" ");
  const header = headerTitle ? `**${headerTitle}**\n\n` : "";
  const multiple = question.multiple ? t("question.multi_hint") : "";
  return `${header}${question.question}${multiple}`;
}

function buildQuestionKeyboard(
  question: { options: Array<{ label: string; description: string }>; multiple?: boolean },
  selectedOptions: Set<number>,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  const questionIndex = questionManager.getCurrentIndex();

  logger.debug(`[QuestionHandler] Building keyboard for question ${questionIndex}`);

  question.options.forEach((option, index) => {
    const isSelected = selectedOptions.has(index);
    const icon = isSelected ? "✅ " : "";
    const buttonText = formatButtonText(option.label, option.description, icon);
    const callbackData = `question:select:${questionIndex}:${index}`;

    logger.debug(`[QuestionHandler] Button ${index}: "${buttonText}" -> "${callbackData}"`);

    keyboard.text(buttonText, callbackData).row();
  });

  if (question.multiple) {
    keyboard.text(t("question.button.submit"), `question:submit:${questionIndex}`);
    logger.debug(`[QuestionHandler] Added submit button`);
  }

  keyboard.text(t("question.button.custom"), `question:custom:${questionIndex}`);
  logger.debug(`[QuestionHandler] Added custom answer button`);

  keyboard.text(t("question.button.cancel"), `question:cancel:${questionIndex}`);
  logger.debug(`[QuestionHandler] Added cancel button`);

  logger.debug(`[QuestionHandler] Final keyboard: ${JSON.stringify(keyboard.inline_keyboard)}`);

  return keyboard;
}

function formatButtonText(label: string, description: string, icon: string): string {
  let text = `${icon}${label}`;

  if (description && icon === "") {
    text += ` - ${description}`;
  }

  if (text.length > MAX_BUTTON_LENGTH) {
    text = text.substring(0, MAX_BUTTON_LENGTH - 3) + "...";
  }

  return text;
}

function formatAnswersSummary(answers: Array<{ question: string; answer: string }>): string {
  let summary = t("question.summary.title");

  answers.forEach((item, index) => {
    summary += t("question.summary.question", {
      index: index + 1,
      question: item.question,
    });
    summary += t("question.summary.answer", { answer: item.answer });
  });

  return summary;
}
