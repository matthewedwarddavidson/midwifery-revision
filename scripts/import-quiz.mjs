// Turns a Word quiz into the app's JSON format.
// The Word file lists each question as a paragraph followed by its options; correct options are highlighted.
// Options are list items, or plain "True"/"False" lines.
//
// Usage: node scripts/import-quiz.mjs <quiz.docx> <out.json> --prefix umc
// Re-importing into an existing file keeps each question's id and topic when its prompt is unchanged,
// so progress recorded against those ids survives.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { unzipSync, strFromU8 } from 'fflate'

function decodeXml(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

/** The document's paragraphs with their text, whether they're list items and whether any text is highlighted. */
function readParagraphs(docxPath) {
  const files = unzipSync(readFileSync(docxPath))
  const xml = strFromU8(files['word/document.xml'])
  return [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(([paragraph]) => ({
    text: decodeXml([...paragraph.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((match) => match[1]).join(''))
      .replace(/\s+/g, ' ')
      .trim(),
    isListItem: paragraph.includes('<w:numPr>'),
    isHighlighted: /<w:highlight w:val="(?!none)/.test(paragraph),
  }))
}

const SELECT_NOTE = /^\(select [^)]*\)$/i
const TRUE_FALSE = /^(true|false)$/i

function parseQuestions(paragraphs) {
  const questions = []
  let current
  for (const { text, isListItem, isHighlighted } of paragraphs) {
    if (!text) continue
    const isOption = current && (isListItem || TRUE_FALSE.test(text))
    if (isOption) {
      current.choices.push({ text, correct: isHighlighted })
    } else if (current && (current.choices.length === 0 || SELECT_NOTE.test(text))) {
      // A second line of the prompt, such as "(Select 3)" or the start of a sentence to complete.
      current.prompt += `\n${text}`
    } else {
      current = { prompt: text, choices: [] }
      questions.push(current)
    }
  }
  return questions
}

function checkQuestions(questions) {
  const problems = questions
    .map((question, index) => {
      if (question.choices.length < 2) return `Question ${index + 1} has fewer than 2 options: ${question.prompt}`
      if (!question.choices.some((choice) => choice.correct))
        return `Question ${index + 1} has no highlighted answer: ${question.prompt}`
      return undefined
    })
    .filter(Boolean)
  if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
}

function main() {
  const [docxPath, outPath, ...flags] = process.argv.slice(2)
  const prefix = flags[flags.indexOf('--prefix') + 1]
  if (!docxPath || !outPath || !flags.includes('--prefix') || !prefix) {
    console.error('Usage: node scripts/import-quiz.mjs <quiz.docx> <out.json> --prefix <id-prefix>')
    process.exit(1)
  }

  const questions = parseQuestions(readParagraphs(docxPath))
  checkQuestions(questions)

  const previous = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : []
  const previousByPrompt = new Map(previous.map((question) => [question.prompt, question]))
  const usedNumbers = previous.map((question) => Number(question.id.split('-').pop()))
  let nextNumber = Math.max(0, ...usedNumbers) + 1

  const result = questions.map((question) => {
    const match = previousByPrompt.get(question.prompt)
    const id = match?.id ?? `${prefix}-${String(nextNumber++).padStart(3, '0')}`
    return { id, topic: match?.topic ?? '', prompt: question.prompt, choices: question.choices }
  })
  writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n')
  console.log(`Wrote ${result.length} questions to ${outPath}`)
}

main()
