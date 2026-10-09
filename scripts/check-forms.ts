import { checkInput } from '../src/engine/check'
const base = { id:'t', kind:'input' as const, prompt:'', hints:[], solution:[], answerDisplay:'' }
const cases: [any, string, string][] = [
  [{...base, answers:['x=5']}, '5', 'correct'],
  [{...base, answers:['x=5']}, 'x=5', 'correct'],
  [{...base, answers:['x=-3']}, '-3', 'correct'],
  [{...base, answers:['1102.5'], tolerance:0.011}, '1{,}102.50', 'correct'],
  [{...base, answers:['1102.5'], tolerance:0.011}, '1102.51', 'correct'],
  [{...base, answers:['1102.5'], tolerance:0.011}, '1103', 'wrong'],
  [{...base, answers:['3n+2']}, '2+3n', 'correct'],
  [{...base, answers:['3n+2']}, '3n-2', 'wrong'],
  [{...base, answers:['\\frac{3}{4}'], requireSimplest:true}, '\\frac{6}{8}', 'notSimplest'],
  [{...base, answers:['\\frac{3}{4}'], requireSimplest:true}, '\\frac{3}{4}', 'correct'],
  [{...base, answers:['\\frac{3}{4}']}, '0.75', 'correct'],
  [{...base, answers:['\\frac{3}{2}']}, '1\\frac{1}{2}', 'correct'],
  [{...base, answers:['50']}, '50\\%', 'correct'],
  [{...base, answers:['7']}, '\\frac{14}{\\placeholder{}}', 'wrong'],
  [{...base, answers:['7']}, '', 'empty'],
]
for (const [q, typed, want] of cases) { const got = checkInput(q, typed); console.log(got===want?'ok  ':'FAIL', typed, '→', got, want) }
