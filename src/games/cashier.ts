// Sari-Sari Store Cashier: catalogue, Philippine money, and order generation for the three antas.
// Pure (rand is injectable) so scripts/games-test.ts can check thousands of orders.
import type { IconName } from '../components/Icon'
import type { TopicId } from '../engine/topics'

export type CashierMode = 'easy' | 'medium' | 'hard'

export interface Denom {
  id: string
  label: string
  cents: number // 100 = ₱1.00
  type: 'bill' | 'coin'
  bg: string
  border: string
  textColor: string
  accent?: string
  /** Pipo peso art in public/currency/<art>.webp (built by scripts/build-currency.mjs). 5¢ and 1¢ have
   *  no art yet, so they keep the styled chip drawn from bg/border/textColor. */
  art?: string
}

/**
 * What a cashier actually handles today. Coins: the BSP New Generation Currency series — ₱20, ₱10,
 * ₱5, ₱1, 25¢, 5¢, 1¢. (The 10-sentimo coin was dropped from the NGC series and is no longer minted.)
 * Bills: ₱1000, ₱500, ₱200, ₱100, ₱50, and the ₱20 bill that still circulates beside the ₱20 coin.
 */
export const DENOMINATIONS: Denom[] = [
  { id: 'b1000', label: '₱1,000', cents: 100000, type: 'bill', bg: '#1E58A4', border: '#143C70', textColor: '#FFFFFF', accent: '#6FA4E8', art: 'bill_1000' },
  { id: 'b500', label: '₱500', cents: 50000, type: 'bill', bg: '#CCA01A', border: '#8A6A0B', textColor: '#FFFFFF', accent: '#FFE885', art: 'bill_500' },
  { id: 'b200', label: '₱200', cents: 20000, type: 'bill', bg: '#238A4B', border: '#175E33', textColor: '#FFFFFF', accent: '#7CE5A4', art: 'bill_200' },
  { id: 'b100', label: '₱100', cents: 10000, type: 'bill', bg: '#6B3FA0', border: '#46276B', textColor: '#FFFFFF', accent: '#C8A4F8', art: 'bill_100' },
  { id: 'b50', label: '₱50', cents: 5000, type: 'bill', bg: '#C5374C', border: '#882231', textColor: '#FFFFFF', accent: '#FFA6B3', art: 'bill_50' },
  { id: 'b20', label: '₱20', cents: 2000, type: 'bill', bg: '#D36A26', border: '#924615', textColor: '#FFFFFF', accent: '#FFB885', art: 'bill_20' },
  { id: 'c20', label: '₱20', cents: 2000, type: 'coin', bg: '#C4943E', border: '#9E7428', textColor: '#3C3346', accent: '#E8E3EE', art: 'coin_20' },
  { id: 'c10', label: '₱10', cents: 1000, type: 'coin', bg: '#C0BAC6', border: '#8F8798', textColor: '#3C3346', accent: '#D8AA48', art: 'coin_10' },
  { id: 'c5', label: '₱5', cents: 500, type: 'coin', bg: '#C8C4CE', border: '#96909E', textColor: '#3C3346', art: 'coin_5' },
  { id: 'c1', label: '₱1', cents: 100, type: 'coin', bg: '#DDD9E2', border: '#ABA4B4', textColor: '#3C3346', art: 'coin_1' },
  { id: 'c025', label: '25¢', cents: 25, type: 'coin', bg: '#D4A234', border: '#96711E', textColor: '#3C3346', art: 'coin_25c' },
  { id: 'c005', label: '5¢', cents: 5, type: 'coin', bg: '#C9C4CF', border: '#9A93A3', textColor: '#3C3346' },
  { id: 'c001', label: '1¢', cents: 1, type: 'coin', bg: '#D9CFC2', border: '#A99C8B', textColor: '#3C3346' },
]

export function formatPeso(cents: number): string {
  const [whole, dec] = (cents / 100).toFixed(2).split('.')
  return `₱${parseInt(whole, 10).toLocaleString('en-PH')}.${dec}`
}

export interface StoreItem { id: string; name: string; cents: number; icon: IconName; unit?: string }

const I = (id: string, name: string, pesos: number, icon: IconName, unit?: string): StoreItem => ({ id, name, cents: Math.round(pesos * 100), icon, unit })

/** Everyday sari-sari prices (2025–26). Whole-peso items power Tingi-tingi and Sukli Master. */
export const ITEMS: StoreItem[] = [
  // noodles & instant food
  I('canton', 'Pancit Canton', 18, 'noodles'), I('mami', 'Instant Mami', 14, 'noodles'), I('cup-noodles', 'Cup Noodles', 28, 'noodles'),
  I('bihon', 'Bihon (¼ kilo)', 30, 'noodles'), I('lugaw', 'Instant Lugaw', 16, 'noodles'),
  // drinks
  I('coke-mismo', 'Softdrinks Mismo', 20, 'bottle'), I('softdrinks-1l', 'Softdrinks 1.5L', 75, 'bottle'), I('juice-pouch', 'Juice Pouch', 12, 'bottle'),
  I('tubig', 'Mineral Water 500mL', 15, 'bottle'), I('c2', 'Iced Tea Bottle', 25, 'bottle'), I('energy', 'Energy Drink', 28, 'bottle'),
  // coffee & milk
  I('kape', '3-in-1 Kape', 9, 'coffee'), I('kape-twin', 'Kape Twin Pack', 20, 'coffee'), I('choco', 'Choco Drink Sachet', 12, 'coffee'),
  I('gatas-sachet', 'Gatas na Pulbos (sachet)', 13, 'milk'), I('evap', 'Evaporated Milk', 36, 'milk'), I('condensada', 'Condensed Milk', 45, 'milk'),
  // bread & biscuits
  I('pandesal', 'Pandesal (5 pcs)', 15, 'bread'), I('tasty', 'Tinapay (loaf)', 75, 'bread'), I('monay', 'Monay', 8, 'bread'),
  I('crackers', 'Crackers', 8, 'biscuit'), I('skyflakes', 'Skyflakes (3 pcs)', 22, 'biscuit'), I('sandwich-cookie', 'Sandwich Cookies', 10, 'biscuit'),
  I('wafer', 'Wafer', 7, 'biscuit'),
  // snacks & candy
  I('chichirya', 'Chichirya', 18, 'chips'), I('chips-big', 'Chips (malaki)', 35, 'chips'), I('mani', 'Mani', 10, 'chips'),
  I('kendi', 'Kendi (3 pcs)', 3, 'candy'), I('lollipop', 'Lollipop', 5, 'candy'), I('chocnut', 'Chocnut', 2, 'candy'), I('ice-candy', 'Ice Candy', 5, 'candy'),
  // canned goods
  I('sardinas', 'Sardinas', 24, 'can'), I('corned-beef', 'Corned Beef', 42, 'can'), I('tuna', 'Tuna Flakes', 38, 'can'),
  I('meat-loaf', 'Meat Loaf', 25, 'can'), I('beef-loaf', 'Beef Loaf', 26, 'can'),
  // staples
  I('bigas', 'Bigas', 52, 'sack', 'kilo'), I('asukal', 'Asukal (¼ kilo)', 22, 'sack'), I('asin', 'Asin', 8, 'sack'),
  I('harina', 'Harina (¼ kilo)', 18, 'sack'), I('itlog', 'Itlog', 9, 'egg'), I('itlog-dosena', 'Itlog (isang dosena)', 105, 'egg'),
  // condiments & cooking
  I('toyo', 'Toyo (sachet)', 6, 'condiment'), I('suka', 'Suka (sachet)', 6, 'condiment'), I('patis', 'Patis (bote)', 25, 'condiment'),
  I('mantika', 'Mantika (bote)', 48, 'condiment'), I('ketchup', 'Ketchup (sachet)', 10, 'condiment'), I('magic-sarap', 'Seasoning (sachet)', 5, 'condiment'),
  // household
  I('sabon-panlaba', 'Sabon Panlaba (bar)', 24, 'soap'), I('sabon-paligo', 'Sabon Paligo', 38, 'soap'), I('shampoo', 'Shampoo (sachet)', 7, 'soap'),
  I('toothpaste', 'Toothpaste (sachet)', 10, 'soap'), I('fabcon', 'Fabric Conditioner (sachet)', 8, 'soap'), I('dishwash', 'Dishwashing Liquid (sachet)', 9, 'soap'),
  // load
  I('load-15', 'E-load ₱15', 15, 'phone'), I('load-30', 'E-load ₱30', 30, 'phone'), I('load-50', 'E-load ₱50', 50, 'phone'),
]

/** Sentimo prices — tingi and repacked goods, the kind of price that needs coins under ₱1 */
export const DECIMAL_ITEMS: StoreItem[] = [
  I('kape-d', '3-in-1 Kape', 9.75, 'coffee'), I('mantika-tingi', 'Mantika (tingi)', 12.5, 'condiment'), I('asukal-tingi', 'Asukal (tingi)', 15.25, 'sack'),
  I('itlog-d', 'Itlog (malaki)', 9.5, 'egg'), I('toyo-d', 'Toyo (¼ bote)', 8.75, 'condiment'), I('suka-d', 'Suka (¼ bote)', 7.25, 'condiment'),
  I('crackers-d', 'Crackers (pack)', 7.5, 'biscuit'), I('chichirya-d', 'Chichirya (maliit)', 10.5, 'chips'), I('sabon-d', 'Sabon Panlaba (½ bar)', 12.25, 'soap'),
  I('shampoo-d', 'Shampoo (sachet)', 7.75, 'soap'), I('bigas-d', 'Bigas (½ kilo)', 26.5, 'sack'), I('harina-d', 'Harina (tingi)', 9.25, 'sack'),
  I('evap-d', 'Evaporated Milk (maliit)', 21.75, 'milk'), I('sardinas-d', 'Sardinas (promo)', 22.95, 'can'), I('tuna-d', 'Tuna (promo)', 35.45, 'can'),
  I('juice-d', 'Juice Pouch (promo)', 11.65, 'bottle'), I('gatas-d', 'Gatas (sachet, promo)', 12.35, 'milk'), I('noodles-d', 'Instant Mami (promo)', 13.85, 'noodles'),
  I('softdrinks-d', 'Softdrinks 1.5L (promo)', 74.99, 'bottle'), I('corned-d', 'Corned Beef (promo)', 41.99, 'can'),
]

export const CUSTOMER_NAMES = ['Nanay Rosa', 'Carlo', 'Maria', 'Mang Jose', 'Ate Bea', 'Kuya Ben', 'Aling Tess', 'Jomar', 'Lola Remedios', 'Totoy', 'Ate Joy', 'Mang Ramon', 'Bunso', 'Tita Cora', 'Kuya Paolo', 'Aling Nena']

export interface OrderItem { item: StoreItem; qty: number }

export interface CustomerOrder {
  customerName: string
  items: OrderItem[]
  totalCents: number
  /** what the customer hands over (undefined = pays exactly; you lay down the payment) */
  paidCents?: number
  paidNote?: string
  /** what the learner must lay on the counter: the payment (easy) or the sukli */
  targetCents: number
  mode: CashierMode
  topic: TopicId
  instruction: string
}

type Rand = () => number
const pickOf = <T,>(a: readonly T[], r: Rand) => a[Math.floor(r() * a.length)]
const between = (lo: number, hi: number, r: Rand) => lo + Math.floor(r() * (hi - lo + 1))

function basket(pool: StoreItem[], lines: number, maxQty: number, r: Rand): OrderItem[] {
  const out: OrderItem[] = []
  while (out.length < lines) {
    const item = pickOf(pool, r)
    if (out.some((o) => o.item.id === item.id)) continue
    // big-ticket items rarely come in threes
    const qty = item.cents >= 4000 ? 1 : between(1, maxQty, r)
    out.push({ item, qty })
  }
  return out
}

const total = (items: OrderItem[]) => items.reduce((s, o) => s + o.item.cents * o.qty, 0)
const units = (items: OrderItem[]) => items.reduce((s, o) => s + o.qty, 0)
export const listText = (items: OrderItem[]) =>
  items.map((o) => (o.item.unit ? `${o.qty} ${o.item.unit} ${o.item.name}` : `${o.qty > 1 ? `${o.qty} ` : ''}${o.item.name}`)).join(', ')

const BILLS = [2000, 5000, 10000, 20000, 50000, 100000]

/** How a real customer pays: usually the smallest bill that covers it; sometimes a big bill
 *  ("walang barya"); sometimes bill + coins so the sukli comes out round. */
export function tender(totalCents: number, r: Rand): { paid: number; note?: string } {
  const smallest = BILLS.find((b) => b > totalCents) ?? Math.ceil((totalCents + 1) / 100000) * 100000
  const roll = r()
  if (roll < 0.2) {
    const bigger = BILLS.filter((b) => b > smallest && b <= Math.max(50000, smallest * 5))
    if (bigger.length) return { paid: pickOf(bigger, r), note: 'Walang barya si suki, kaya malaking bill ang inabot' }
  }
  if (roll < 0.35) {
    // e.g. ₱68 → hands ₱103 so the sukli is a clean ₱35
    const extra = totalCents % 500
    if (extra && extra % 100 === 0) {
      return { paid: smallest + extra, note: `Nagdagdag si suki ng ${formatPeso(extra)} para buo ang sukli` }
    }
  }
  return { paid: smallest }
}

/** One customer for the chosen antas */
export function generateOrder(mode: CashierMode, r: Rand = Math.random): CustomerOrder {
  const customerName = pickOf(CUSTOMER_NAMES, r)

  if (mode === 'easy') {
    // Tingi-tingi: pay exactly, whole pesos — 1 to 3 items, sometimes more than one of an item
    const items = basket(ITEMS.filter((i) => i.cents <= 5000), between(1, 3, r), 3, r)
    const totalCents = total(items)
    const multi = units(items) > 1
    return {
      customerName, items, totalCents, targetCents: totalCents, mode,
      topic: multi ? 'money-multi-item' : 'money-exact-payment',
      instruction: `Bumili si ${customerName} ng ${listText(items)}. ${multi ? 'Pagsamahin ang presyo, tapos i' : 'I'}lapag ang eksaktong bayad na ${formatPeso(totalCents)}!`,
    }
  }

  if (mode === 'medium') {
    // Sukli Master: whole-peso change, bigger baskets, realistic payment
    const items = basket(ITEMS, between(1, 4, r), 3, r)
    const totalCents = total(items)
    const { paid, note } = tender(totalCents, r)
    return {
      customerName, items, totalCents, paidCents: paid, paidNote: note, targetCents: paid - totalCents, mode,
      topic: 'money-sukli-whole',
      instruction: `Bumili si ${customerName} ng ${listText(items)} (${formatPeso(totalCents)}). Nag-abot siya ng ${formatPeso(paid)}. Ibigay ang eksaktong sukling ${formatPeso(paid - totalCents)}!`,
    }
  }

  // Sentimo: centavo prices — mostly sukli, sometimes exact payment with coins under ₱1
  const decimalLines = between(1, 2, r)
  const items = [...basket(DECIMAL_ITEMS, decimalLines, 2, r), ...(r() < 0.5 ? basket(ITEMS.filter((i) => i.cents <= 3000), 1, 2, r) : [])]
  const totalCents = total(items)
  if (r() < 0.25) {
    return {
      customerName, items, totalCents, targetCents: totalCents, mode,
      topic: 'money-exact-decimal',
      instruction: `Bumili si ${customerName} ng ${listText(items)}. Ilapag ang eksaktong bayad na ${formatPeso(totalCents)} — kasama ang sentimo!`,
    }
  }
  const { paid, note } = tender(totalCents, r)
  return {
    customerName, items, totalCents, paidCents: paid, paidNote: note, targetCents: paid - totalCents, mode,
    topic: 'money-sukli-decimal',
    instruction: `Bumili si ${customerName} ng ${listText(items)} (${formatPeso(totalCents)}). Nag-abot siya ng ${formatPeso(paid)}. Ilatag ang eksaktong sukli na may sentimo (${formatPeso(paid - totalCents)})!`,
  }
}

/** Fewest pieces of money that make an amount (greedy is optimal for PH denominations) */
export function makeChange(cents: number): { id: string; count: number }[] {
  const out: { id: string; count: number }[] = []
  let left = cents
  for (const d of DENOMINATIONS.filter((x) => x.id !== 'b20')) {
    const n = Math.floor(left / d.cents)
    if (n) { out.push({ id: d.id, count: n }); left -= n * d.cents }
  }
  return left === 0 ? out : []
}
