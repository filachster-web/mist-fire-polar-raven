import type { SourceInput } from "./types";

const chatGpt = {
  title: "Приёмка на фулфилменте",
  create_time: 1740000000,
  update_time: 1740001200,
  current_node: "a3",
  mapping: {
    root: { id: "root", message: null, parent: null, children: ["u1"] },
    u1: {
      id: "u1",
      parent: "root",
      children: ["a1", "a2"],
      message: {
        author: { role: "user" },
        create_time: 1740000001,
        recipient: "all",
        content: {
          content_type: "text",
          parts: ["Собери короткую методику приёмки. Нужны таблица этапов и чеклист."],
        },
      },
    },
    a1: {
      id: "a1",
      parent: "u1",
      children: [],
      message: {
        author: { role: "assistant" },
        create_time: 1740000020,
        recipient: "all",
        metadata: { model_slug: "gpt-4o" },
        content: { content_type: "text", parts: ["Черновик ветки, которую не оставили активной."] },
      },
    },
    a2: {
      id: "a2",
      parent: "u1",
      children: ["u2"],
      message: {
        author: { role: "assistant" },
        create_time: 1740000100,
        recipient: "all",
        metadata: { model_slug: "gpt-4o" },
        content: {
          content_type: "text",
          parts: [
            "## Приёмка\n\n| Этап | Срок | Кто |\n| --- | --- | --- |\n| Разгрузка | 30 мин | Смена А |\n| Сверка | 1 час | Кладовщик |\n\n- Скан штрихкодов\n- Фото повреждений\n\n```text\nGATE-IN → SCAN → QA → PUTAWAY\n```",
          ],
        },
      },
    },
    u2: {
      id: "u2",
      parent: "a2",
      children: ["a3"],
      message: {
        author: { role: "user" },
        create_time: 1740000800,
        recipient: "all",
        content: { content_type: "text", parts: ["Добавь контроль Честного ЗНАКа отдельной строкой."] },
      },
    },
    a3: {
      id: "a3",
      parent: "u2",
      children: [],
      message: {
        author: { role: "assistant" },
        create_time: 1740000900,
        recipient: "all",
        metadata: { model_slug: "gpt-4o" },
        content: {
          content_type: "text",
          parts: ["Добавил этап **Маркировка**: сверка кода Честного ЗНАКа до размещения в ячейке."],
        },
      },
    },
    hidden: {
      id: "hidden",
      parent: "root",
      children: [],
      message: {
        author: { role: "system" },
        recipient: "all",
        metadata: { is_visually_hidden_from_conversation: true },
        content: { content_type: "text", parts: ["служебная инструкция"] },
      },
    },
  },
};

const claude = [
  {
    uuid: "c1",
    name: "Склад и маркировка",
    created_at: "2025-09-23T05:52:23.402627Z",
    chat_messages: [
      {
        sender: "human",
        created_at: "2025-09-23T05:52:23.402627Z",
        text: "Собери три шага запуска фулфилмента.",
        content: [{ type: "text", text: "Собери три шага запуска фулфилмента." }],
      },
      {
        sender: "assistant",
        created_at: "2025-09-23T05:52:48.661778Z",
        text: "",
        content: [
          { type: "thinking", thinking: "внутренний черновик" },
          { type: "text", text: "1. Зона приёмки\n2. Сверка маркировки\n3. Размещение\n\n| Шаг | Смысл |\n| --- | --- |\n| 1 | Ворота |\n| 2 | Честный ЗНАК |" },
          { type: "tool_use", name: "search" },
        ],
      },
    ],
  },
];

const markdown = `# Методика смены

Короткое предисловие к смене.

## Пользователь · 2025-09-23T05:52:23.402627Z

Собери регламент открытия смены.

## Claude · 2025-09-23T05:52:48.661778Z

### Открытие

1. Свет и ворота
2. Сверка остатка
3. Первая поставка

> Смена начинается со сверки, не с разгрузки.
`;

const html = `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Ночная смена</title><main><h1>Ночная смена</h1><article><h3>Пользователь</h3><small>2025-06-08T06:52:33.253120Z</small><pre>Кто закрывает ворота?</pre></article><article><h3>Claude</h3><small>2025-06-08T06:52:35.202336Z</small><pre>Старший смены. В журнале нужна **отметка** и время.</pre></article></main></html>`;

const csv = `Этап,Срок,Кто
Разгрузка,30 мин,Смена А
Сверка,1 час,Кладовщик
"Маркировка, ЗНАК",20 мин,Оператор
`;

export const samples: { id: string; label: string; input: SourceInput }[] = [
  { id: "gpt", label: "ChatGPT JSON", input: { name: "conversations.json", text: JSON.stringify(chatGpt) } },
  { id: "claude", label: "Claude JSON", input: { name: "conversations.json", text: JSON.stringify(claude) } },
  { id: "md", label: "Markdown", input: { name: "смена.md", text: markdown } },
  { id: "html", label: "HTML беседа", input: { name: "002.html", text: html } },
  { id: "csv", label: "Таблица CSV", input: { name: "этапы.csv", text: csv } },
];

export const archiveHtml = `<!doctype html><html lang="ru"><title>Create effective flashcards</title><main><h1>Create effective flashcards</h1><p>В экспортированной беседе нет сообщений.</p></main></html>`;
