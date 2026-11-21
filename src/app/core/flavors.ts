import { I18nText } from './models';

/**
 * Bo Coffee's own two-level flavor wheel: 8 families, 4–6 notes each.
 * Deliberately simpler than professional lexicons so beginners can use it while tasting.
 */
export interface FlavorNote {
  id: string;
  name: I18nText;
}

export interface FlavorFamily {
  id: string;
  name: I18nText;
  color: string;
  desc: I18nText;
  notes: FlavorNote[];
}

export const FLAVOR_WHEEL: FlavorFamily[] = [
  {
    id: 'fruity',
    name: { vi: 'Trái cây', en: 'Fruity' },
    color: '#d1495b',
    desc: {
      vi: 'Hay gặp ở cà phê rang sáng, sơ chế natural hoặc vùng cao như Ethiopia, Kenya.',
      en: 'Common in light roasts, natural process coffees and high-grown origins like Ethiopia or Kenya.',
    },
    notes: [
      { id: 'berry', name: { vi: 'Quả mọng', en: 'Berry' } },
      { id: 'citrus', name: { vi: 'Cam chanh', en: 'Citrus' } },
      { id: 'stone-fruit', name: { vi: 'Đào, mận', en: 'Stone fruit' } },
      { id: 'tropical', name: { vi: 'Quả nhiệt đới', en: 'Tropical' } },
      { id: 'dried-fruit', name: { vi: 'Trái cây sấy', en: 'Dried fruit' } },
    ],
  },
  {
    id: 'floral',
    name: { vi: 'Hoa', en: 'Floral' },
    color: '#b56fb3',
    desc: {
      vi: 'Mùi thơm nhẹ, dễ mất khi rang đậm. Đặc trưng của một số giống như Geisha.',
      en: 'Delicate aromas that fade in darker roasts. Typical of some varieties such as Geisha.',
    },
    notes: [
      { id: 'jasmine', name: { vi: 'Hoa nhài', en: 'Jasmine' } },
      { id: 'rose', name: { vi: 'Hoa hồng', en: 'Rose' } },
      { id: 'coffee-blossom', name: { vi: 'Hoa cà phê', en: 'Coffee blossom' } },
      { id: 'black-tea', name: { vi: 'Trà đen', en: 'Black tea' } },
    ],
  },
  {
    id: 'sweet',
    name: { vi: 'Ngọt', en: 'Sweet' },
    color: '#e0a030',
    desc: {
      vi: 'Vị ngọt tự nhiên từ đường caramel hóa khi rang — dấu hiệu chiết xuất cân bằng.',
      en: 'Natural sweetness from sugars caramelised during roasting — a sign of balanced extraction.',
    },
    notes: [
      { id: 'caramel', name: { vi: 'Caramel', en: 'Caramel' } },
      { id: 'honey', name: { vi: 'Mật ong', en: 'Honey' } },
      { id: 'brown-sugar', name: { vi: 'Đường nâu', en: 'Brown sugar' } },
      { id: 'vanilla', name: { vi: 'Vani', en: 'Vanilla' } },
    ],
  },
  {
    id: 'nutty-cocoa',
    name: { vi: 'Hạt & ca cao', en: 'Nutty & cocoa' },
    color: '#8a5a3b',
    desc: {
      vi: 'Nhóm quen thuộc nhất với người uống cà phê Việt: sô-cô-la, hạt rang.',
      en: 'The most familiar family for Vietnamese coffee drinkers: chocolate and roasted nuts.',
    },
    notes: [
      { id: 'dark-chocolate', name: { vi: 'Sô-cô-la đen', en: 'Dark chocolate' } },
      { id: 'milk-chocolate', name: { vi: 'Sô-cô-la sữa', en: 'Milk chocolate' } },
      { id: 'hazelnut', name: { vi: 'Hạt phỉ', en: 'Hazelnut' } },
      { id: 'almond', name: { vi: 'Hạnh nhân', en: 'Almond' } },
      { id: 'peanut', name: { vi: 'Đậu phộng', en: 'Peanut' } },
    ],
  },
  {
    id: 'spice',
    name: { vi: 'Gia vị', en: 'Spice' },
    color: '#c0662d',
    desc: {
      vi: 'Cảm giác ấm, cay nhẹ ở hậu vị.',
      en: 'A warm, gently pungent feel in the finish.',
    },
    notes: [
      { id: 'cinnamon', name: { vi: 'Quế', en: 'Cinnamon' } },
      { id: 'clove', name: { vi: 'Đinh hương', en: 'Clove' } },
      { id: 'pepper', name: { vi: 'Tiêu', en: 'Pepper' } },
    ],
  },
  {
    id: 'roasted',
    name: { vi: 'Rang', en: 'Roasted' },
    color: '#4e3b31',
    desc: {
      vi: 'Đến từ quá trình rang. Ít thì dễ chịu, nhiều thì đắng gắt.',
      en: 'Comes from roasting. Pleasant in moderation, harsh when dominant.',
    },
    notes: [
      { id: 'toasty', name: { vi: 'Bánh mì nướng', en: 'Toast' } },
      { id: 'roasted-grain', name: { vi: 'Ngũ cốc rang', en: 'Roasted grain' } },
      { id: 'smoky', name: { vi: 'Khói', en: 'Smoky' } },
      { id: 'burnt', name: { vi: 'Khét', en: 'Burnt' } },
    ],
  },
  {
    id: 'green',
    name: { vi: 'Thảo mộc', en: 'Herbal' },
    color: '#5b7a4a',
    desc: {
      vi: 'Vị cỏ, đậu xanh: thường do rang chưa tới hoặc chiết xuất thiếu.',
      en: 'Grassy, pea-like notes: often a sign of underdevelopment or under-extraction.',
    },
    notes: [
      { id: 'herbal', name: { vi: 'Thảo mộc', en: 'Herbal' } },
      { id: 'green-tea', name: { vi: 'Trà xanh', en: 'Green tea' } },
      { id: 'grassy', name: { vi: 'Cỏ tươi', en: 'Grassy' } },
    ],
  },
  {
    id: 'sour-fermented',
    name: { vi: 'Lên men', en: 'Fermented' },
    color: '#7a8f2a',
    desc: {
      vi: 'Chua sáng là điểm cộng; chua gắt, mùi rượu nặng có thể do lên men quá đà.',
      en: 'Bright acidity is a plus; sharp sourness or boozy notes can mean over-fermentation.',
    },
    notes: [
      { id: 'winey', name: { vi: 'Rượu vang', en: 'Winey' } },
      { id: 'sour', name: { vi: 'Chua', en: 'Sour' } },
      { id: 'fermented', name: { vi: 'Lên men', en: 'Fermented' } },
    ],
  },
];

export const FLAVOR_BY_ID: ReadonlyMap<string, { note: FlavorNote; family: FlavorFamily }> =
  new Map(
    FLAVOR_WHEEL.flatMap((family) => family.notes.map((note) => [note.id, { note, family }])),
  );
