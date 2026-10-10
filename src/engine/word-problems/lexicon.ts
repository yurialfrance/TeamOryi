// Known-word check for AI stories. Small models can write Tagalog-SHAPED noise ("At i-kayag ng ₱50",
// "Facto, maaapakay ng…") that passes a grammar-word count. Every word in a story must be a known
// Filipino/English word (after stripping common Tagalog affixes), a name, or a word from the
// facts/setting. Deliberately strict: an unknown real word only means the plain template is shown.

/** Tagalog roots and function words likely in a short store / errand / home scene */
const TL = `
ang ng nang sa mga ay si ni sina nina kay kina at o pero dahil kasi kaya tapos saka para pag kung kapag habang bago
pagkatapos hanggang mula noon ngayon na pa din rin lang lamang naman nga po ho ba muna ulit agad din daw raw yata sana
may mayroon wala walang ito iyan iyon yun yung dito diyan doon roon siya niya kanya kaniya sila nila kanila ako ko akin
ikaw ka mo iyo ikaw kami namin amin tayo natin atin kayo ninyo inyo sarili isa isang una unang huli ilan ilang bawat
lahat iba ibang pareho parehong ganito ganyan ganoon ano sino saan kailan bakit paano magkano ilan oo hindi huwag
bili bayad abot kuha dala punta daan dating uwi alis balik pasok labas lakad takbo sakay gising tulog kain inom luto
hain handa tingin kita hanap pili bigay tanggap tawag sabi usap tanong sagot ngiti tawa saya tuwa lungkot gutom uhaw
init lamig ulan araw umaga tanghali hapon gabi kahapon bukas linggo oras saglit sandali
bahay paaralan eskwela eskwelahan klase kanto kalye tindahan tindera tindero suki tiangge palengke panaderya
nanay inay tatay itay ate kuya lola lolo bunso kapatid magkapatid pinsan tita tito kaibigan kapitbahay bata batang anak
pamilya guro titser estudyante aling mang
pera barya sukli presyo halaga piso pisong peso pesos baon ipon gastos utang
utos utusan pakiusap salamat sige tara halika
masarap sarap mainit malamig bago luma malaki laki maliit liit marami dami kaunti konti mabilis bilis mabagal
masaya malungkot gutom busog pagod antok maaga gabi mahal mura
kendi tinapay gatas kape tubig itlog bigas asukal asin toyo suka mantika sabon meryenda merienda pagkain inumin
sitsirya chichirya lata supot bote pakete
gusto ayaw kailangan pwede puwede dapat maaari
tuwing minsan madalas palagi lagi
dumating nakita
`
/** Common English words in Taglish (nouns, adjectives, a few verbs) */
const EN = `
the a an is are was were be been to of and in on at for with this that it its we you your our my his her their
he she they them him then so because by from into as can will would do did does let us here there what when how
all both also very really just only too more most some any one first next last after before while
store shop snack snacks noodles drink drinks bread milk coffee candy money change price total item items buy bought
paid pay pays gave give got get went go goes came come walked walk ran run took take picked pick handed hand
woke wake early late morning afternoon evening night day today home school class friend friends mother mom father dad
sister brother grandma grandpa neighbor errand quickly happy hungry thirsty hot cold warm fresh new small big little
favorite favourite delicious nice good great kind friendly smiled smile counted count wallet coin coins bill bills
sari-sari tindera aling mang nanay
`
const KNOWN = new Set([...TL.split(/\s+/), ...EN.split(/\s+/)].filter(Boolean))

const PREFIXES = ['ipinag', 'ipag', 'ipina', 'ipa', 'pinag', 'pina', 'nakipag', 'nakapag', 'nakapa', 'naka', 'makapag', 'maka',
  'pinaka', 'nag', 'mag', 'nang', 'mang', 'pag', 'pang', 'ka', 'ma', 'na', 'pa', 'i']
// the linker: -ng after a vowel (kaya → kayang), -g only after n (ilan → ilang) — handled below
const SUFFIXES = ['han', 'hin', 'an', 'in', 'ng']

/** Candidate roots for a Tagalog word: affixes (nag-, b-um-ili, -an, -in…) and first-syllable doubling removed */
export function rootsOf(word: string): string[] {
  const w = word.toLowerCase().replace(/-/g, '')
  const out = new Set<string>([w])
  const add = (x: string) => { if (x.length >= 2) out.add(x) }
  const step = (x: string) => {
    add(x)
    for (const s of SUFFIXES) if (x.endsWith(s) && x.length - s.length >= 3) add(x.slice(0, -s.length))
    if (x.endsWith('ng') && x.length >= 4) add(x.slice(0, -1)) // ilang → ilan
    // infix -um- / -in- after the first consonant: b-um-ili, k-in-uha
    const inf = /^([bcdfghjklmnpqrstvwxyz]?)(um|in)(.+)$/.exec(x)
    if (inf) add(inf[1] + inf[3])
    // doubled first syllable: bibili → bili, babayad → bayad
    const dup = /^([bcdfghjklmnpqrstvwxyz]?[aeiou])\1(.+)$/.exec(x)
    if (dup) add(dup[1] + dup[2])
  }
  step(w)
  for (const p of PREFIXES) if (w.startsWith(p) && w.length - p.length >= 3) step(w.slice(p.length))
  // one more pass on what we found (e.g. ipinambili → pinambili → bili)
  for (const r of [...out]) for (const p of PREFIXES) if (r.startsWith(p) && r.length - p.length >= 3) step(r.slice(p.length))
  for (const r of [...out]) { step(r) }
  return [...out]
}

/** Words in the story that are not known (after affix stripping), given extra allowed words */
export function unknownWords(text: string, extra: Iterable<string>): string[] {
  const allowed = new Set([...KNOWN, ...[...extra].flatMap((e) => e.toLowerCase().split(/[\s,.'’-]+/))])
  // numbers (with their ₱ / P / Php mark) are checked elsewhere — drop them here
  const words = text.replace(/(₱|\bphp\s?|\bp(?=\d))?\d[\d,.]*/gi, ' ').toLowerCase().match(/[a-zñ][a-zñ'’-]*/g) ?? []
  return words.filter((w) => {
    const clean = w.replace(/['’]s$/, '').replace(/^['’]+|['’]+$/g, '') // English possessive: nena's → nena
    if (!clean || allowed.has(clean)) return false
    return !rootsOf(clean).some((r) => allowed.has(r))
  })
}
