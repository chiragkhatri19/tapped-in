import type { MicroMap } from '@/data/micronutrients';

export interface FoodItem {
  id: string;
  name: string;
  nameHindi: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isVeg: boolean;
  servingUnit: 'g' | 'ml' | 'roti' | 'idli' | 'dosa' | 'egg' | 'banana' | 'apple' | 'slice' | 'scoop' | 'cup' | 'piece' | 'tbsp';
  servingGrams: number;
  microsPer100g: MicroMap;
  isCustom?: boolean;
}

export const FOODS: FoodItem[] = [
  { id: 'chicken_breast', name: 'Chicken Breast', nameHindi: 'मुर्गे का सीना',
    caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 0.7, calcium: 11, vitaminB12: 0.3, vitaminD: 4, zinc: 1 }},

  { id: 'eggs', name: 'Eggs (whole)', nameHindi: 'अंडे',
    caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11,
    isVeg: false, servingUnit: 'egg', servingGrams: 50,
    microsPer100g: { iron: 1.2, calcium: 50, vitaminB12: 0.9, vitaminD: 44, zinc: 1.1 }},

  { id: 'paneer', name: 'Paneer', nameHindi: 'पनीर',
    caloriesPer100g: 265, proteinPer100g: 18, carbsPer100g: 3.4, fatPer100g: 20,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 0.3, calcium: 480, vitaminB12: 0.8, vitaminD: 0, zinc: 2.5 }},

  { id: 'dal_yellow', name: 'Yellow Dal (cooked)', nameHindi: 'पीली दाल',
    caloriesPer100g: 116, proteinPer100g: 7.6, carbsPer100g: 20, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 1.5, calcium: 19, vitaminB12: 0, vitaminD: 0, zinc: 1.1 }},

  { id: 'rajma', name: 'Rajma (cooked)', nameHindi: 'राजमा',
    caloriesPer100g: 127, proteinPer100g: 8.7, carbsPer100g: 22, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 180,
    microsPer100g: { iron: 2.9, calcium: 28, vitaminB12: 0, vitaminD: 0, zinc: 1.4 }},

  { id: 'chole', name: 'Chole (cooked)', nameHindi: 'छोले',
    caloriesPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27, fatPer100g: 2.6,
    isVeg: true, servingUnit: 'cup', servingGrams: 180,
    microsPer100g: { iron: 2.9, calcium: 49, vitaminB12: 0, vitaminD: 0, zinc: 1.5 }},

  { id: 'white_rice', name: 'White Rice (cooked)', nameHindi: 'चावल',
    caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.2, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'brown_rice', name: 'Brown Rice (cooked)', nameHindi: 'भूरे चावल',
    caloriesPer100g: 122, proteinPer100g: 2.6, carbsPer100g: 25, fatPer100g: 0.9,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.4, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'roti', name: 'Roti (whole wheat)', nameHindi: 'रोटी',
    caloriesPer100g: 297, proteinPer100g: 10, carbsPer100g: 55, fatPer100g: 3.7,
    isVeg: true, servingUnit: 'roti', servingGrams: 30,
    microsPer100g: { iron: 2.5, calcium: 34, vitaminB12: 0, vitaminD: 0, zinc: 1.2 }},

  { id: 'oats', name: 'Oats (dry)', nameHindi: 'ओट्स',
    caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7,
    isVeg: true, servingUnit: 'cup', servingGrams: 80,
    microsPer100g: { iron: 4.7, calcium: 54, vitaminB12: 0, vitaminD: 0, zinc: 3.6 }},

  { id: 'greek_yogurt', name: 'Greek Yogurt', nameHindi: 'ग्रीक दही',
    caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.1, calcium: 111, vitaminB12: 0.5, vitaminD: 0, zinc: 0.6 }},

  { id: 'dahi', name: 'Dahi (full fat)', nameHindi: 'दही',
    caloriesPer100g: 98, proteinPer100g: 3.5, carbsPer100g: 3.4, fatPer100g: 7.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.1, calcium: 120, vitaminB12: 0.4, vitaminD: 0, zinc: 0.5 }},

  { id: 'milk', name: 'Milk (full fat)', nameHindi: 'दूध',
    caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0, calcium: 113, vitaminB12: 0.5, vitaminD: 40, zinc: 0.4 }},

  { id: 'banana', name: 'Banana', nameHindi: 'केला',
    caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'banana', servingGrams: 120,
    microsPer100g: { iron: 0.3, calcium: 5, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'apple', name: 'Apple', nameHindi: 'सेब',
    caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'apple', servingGrams: 150,
    microsPer100g: { iron: 0.1, calcium: 6, vitaminB12: 0, vitaminD: 0, zinc: 0 }},

  { id: 'sweet_potato', name: 'Sweet Potato (cooked)', nameHindi: 'शकरकंद',
    caloriesPer100g: 90, proteinPer100g: 2, carbsPer100g: 21, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 0.7, calcium: 30, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'almonds', name: 'Almonds', nameHindi: 'बादाम',
    caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 3.7, calcium: 264, vitaminB12: 0, vitaminD: 0, zinc: 3.1 }},

  { id: 'peanuts', name: 'Peanuts', nameHindi: 'मूंगफली',
    caloriesPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 2, calcium: 54, vitaminB12: 0, vitaminD: 0, zinc: 3.3 }},

  { id: 'whey_protein', name: 'Whey Protein', nameHindi: 'व्हे प्रोटीन',
    caloriesPer100g: 400, proteinPer100g: 80, carbsPer100g: 8, fatPer100g: 5,
    isVeg: false, servingUnit: 'scoop', servingGrams: 30,
    microsPer100g: { iron: 0.5, calcium: 100, vitaminB12: 0.5, vitaminD: 0, zinc: 1.5 }},

  { id: 'tuna', name: 'Tuna (canned)', nameHindi: 'टूना',
    caloriesPer100g: 132, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 1,
    isVeg: false, servingUnit: 'g', servingGrams: 85,
    microsPer100g: { iron: 1, calcium: 10, vitaminB12: 2.5, vitaminD: 136, zinc: 0.8 }},

  { id: 'soya_chunks', name: 'Soya Chunks (dry)', nameHindi: 'सोया चंक्स',
    caloriesPer100g: 336, proteinPer100g: 52, carbsPer100g: 33, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'g', servingGrams: 50,
    microsPer100g: { iron: 8, calcium: 350, vitaminB12: 0, vitaminD: 0, zinc: 4 }},

  { id: 'tofu', name: 'Tofu (firm)', nameHindi: 'टोफू',
    caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 2.7, calcium: 350, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'masoor_dal', name: 'Masoor Dal (cooked)', nameHindi: 'मसूर दाल',
    caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 3.3, calcium: 19, vitaminB12: 0, vitaminD: 0, zinc: 1.3 }},

  { id: 'peanut_butter', name: 'Peanut Butter', nameHindi: 'मूंगफली का मक्खन',
    caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50,
    isVeg: true, servingUnit: 'g', servingGrams: 32,
    microsPer100g: { iron: 1.9, calcium: 43, vitaminB12: 0, vitaminD: 0, zinc: 2.9 }},

  { id: 'spinach', name: 'Spinach (raw)', nameHindi: 'पालक',
    caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 30,
    microsPer100g: { iron: 2.7, calcium: 99, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'bread_ww', name: 'Whole Wheat Bread', nameHindi: 'गेहूं की ब्रेड',
    caloriesPer100g: 247, proteinPer100g: 9, carbsPer100g: 47, fatPer100g: 3.4,
    isVeg: true, servingUnit: 'slice', servingGrams: 28,
    microsPer100g: { iron: 2.4, calcium: 80, vitaminB12: 0, vitaminD: 0, zinc: 0.9 }},

  { id: 'cottage_cheese', name: 'Cottage Cheese (low fat)', nameHindi: 'लो फैट पनीर',
    caloriesPer100g: 72, proteinPer100g: 12.5, carbsPer100g: 2.7, fatPer100g: 1,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.1, calcium: 83, vitaminB12: 0.4, vitaminD: 0, zinc: 0.5 }},

  { id: 'potato', name: 'Potato (boiled)', nameHindi: 'आलू',
    caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 0.3, calcium: 8, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'moong_dal', name: 'Moong Dal (cooked)', nameHindi: 'मूंग दाल',
    caloriesPer100g: 104, proteinPer100g: 7.6, carbsPer100g: 18, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 1.4, calcium: 27, vitaminB12: 0, vitaminD: 0, zinc: 0.9 }},

  { id: 'egg_white', name: 'Egg White (boiled)', nameHindi: 'अंडे का सफेद',
    caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2,
    isVeg: false, servingUnit: 'egg', servingGrams: 33,
    microsPer100g: { iron: 0.1, calcium: 7, vitaminB12: 0, vitaminD: 0, zinc: 0 }},

  // ── Indian grains & breads ────────────────────────────

  { id: 'roti_maida', name: 'Roti (Maida / plain flour)', nameHindi: 'मैदे की रोटी',
    caloriesPer100g: 328, proteinPer100g: 9, carbsPer100g: 63, fatPer100g: 5,
    isVeg: true, servingUnit: 'roti', servingGrams: 30,
    microsPer100g: { iron: 1.2, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'bajra_roti', name: 'Bajra Roti', nameHindi: 'बाजरे की रोटी',
    caloriesPer100g: 292, proteinPer100g: 9.6, carbsPer100g: 56, fatPer100g: 4.1,
    isVeg: true, servingUnit: 'roti', servingGrams: 35,
    microsPer100g: { iron: 8, calcium: 42, vitaminB12: 0, vitaminD: 0, zinc: 2.7 }},

  { id: 'jowar_roti', name: 'Jowar Roti', nameHindi: 'ज्वार की रोटी',
    caloriesPer100g: 329, proteinPer100g: 10.4, carbsPer100g: 66, fatPer100g: 3.5,
    isVeg: true, servingUnit: 'roti', servingGrams: 35,
    microsPer100g: { iron: 4.1, calcium: 25, vitaminB12: 0, vitaminD: 0, zinc: 1.7 }},

  { id: 'makki_roti', name: 'Makki di Roti', nameHindi: 'मक्के की रोटी',
    caloriesPer100g: 339, proteinPer100g: 8.5, carbsPer100g: 67, fatPer100g: 4.3,
    isVeg: true, servingUnit: 'roti', servingGrams: 40,
    microsPer100g: { iron: 2.7, calcium: 6, vitaminB12: 0, vitaminD: 0, zinc: 1.1 }},

  { id: 'paratha_plain', name: 'Paratha (plain)', nameHindi: 'सादा पराठा',
    caloriesPer100g: 340, proteinPer100g: 8, carbsPer100g: 48, fatPer100g: 13,
    isVeg: true, servingUnit: 'roti', servingGrams: 60,
    microsPer100g: { iron: 2.2, calcium: 28, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'paratha_aloo', name: 'Aloo Paratha', nameHindi: 'आलू पराठा',
    caloriesPer100g: 280, proteinPer100g: 6.5, carbsPer100g: 43, fatPer100g: 9,
    isVeg: true, servingUnit: 'roti', servingGrams: 80,
    microsPer100g: { iron: 1.8, calcium: 24, vitaminB12: 0, vitaminD: 0, zinc: 0.8 }},

  { id: 'naan', name: 'Naan', nameHindi: 'नान',
    caloriesPer100g: 317, proteinPer100g: 10.8, carbsPer100g: 53, fatPer100g: 8,
    isVeg: true, servingUnit: 'piece', servingGrams: 90,
    microsPer100g: { iron: 2.5, calcium: 72, vitaminB12: 0, vitaminD: 0, zinc: 0.9 }},

  { id: 'puri', name: 'Puri', nameHindi: 'पूरी',
    caloriesPer100g: 369, proteinPer100g: 8, carbsPer100g: 52, fatPer100g: 15,
    isVeg: true, servingUnit: 'piece', servingGrams: 25,
    microsPer100g: { iron: 2, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.8 }},

  { id: 'basmati_rice', name: 'Basmati Rice (cooked)', nameHindi: 'बासमती चावल',
    caloriesPer100g: 150, proteinPer100g: 3.5, carbsPer100g: 32, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 180,
    microsPer100g: { iron: 0.2, calcium: 3, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'poha', name: 'Poha (cooked)', nameHindi: 'पोहा',
    caloriesPer100g: 130, proteinPer100g: 2.5, carbsPer100g: 27, fatPer100g: 1.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 180,
    microsPer100g: { iron: 5.4, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'upma', name: 'Upma (suji)', nameHindi: 'उपमा',
    caloriesPer100g: 120, proteinPer100g: 3.2, carbsPer100g: 22, fatPer100g: 2.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 180,
    microsPer100g: { iron: 1.2, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'idli', name: 'Idli (steamed)', nameHindi: 'इडली',
    caloriesPer100g: 116, proteinPer100g: 3.4, carbsPer100g: 23, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'idli', servingGrams: 50,
    microsPer100g: { iron: 0.5, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'dosa_plain', name: 'Dosa (plain)', nameHindi: 'सादा डोसा',
    caloriesPer100g: 170, proteinPer100g: 3.5, carbsPer100g: 30, fatPer100g: 3.2,
    isVeg: true, servingUnit: 'dosa', servingGrams: 80,
    microsPer100g: { iron: 0.6, calcium: 22, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'uttapam', name: 'Uttapam', nameHindi: 'उत्तपम',
    caloriesPer100g: 140, proteinPer100g: 3.7, carbsPer100g: 26, fatPer100g: 2.4,
    isVeg: true, servingUnit: 'piece', servingGrams: 90,
    microsPer100g: { iron: 0.6, calcium: 25, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'besan_chilla', name: 'Besan Chilla', nameHindi: 'बेसन चीला',
    caloriesPer100g: 180, proteinPer100g: 9.5, carbsPer100g: 25, fatPer100g: 4.5,
    isVeg: true, servingUnit: 'piece', servingGrams: 70,
    microsPer100g: { iron: 2.5, calcium: 30, vitaminB12: 0, vitaminD: 0, zinc: 1.2 }},

  { id: 'khichdi', name: 'Khichdi (dal-rice)', nameHindi: 'खिचड़ी',
    caloriesPer100g: 110, proteinPer100g: 4.5, carbsPer100g: 20, fatPer100g: 1.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 1, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  // ── Indian pulses & legumes ───────────────────────────

  { id: 'chana_dal', name: 'Chana Dal (cooked)', nameHindi: 'चना दाल',
    caloriesPer100g: 164, proteinPer100g: 9, carbsPer100g: 27, fatPer100g: 2.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 3.1, calcium: 57, vitaminB12: 0, vitaminD: 0, zinc: 1.5 }},

  { id: 'urad_dal', name: 'Urad Dal (cooked)', nameHindi: 'उड़द दाल',
    caloriesPer100g: 116, proteinPer100g: 7.6, carbsPer100g: 20, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 3.5, calcium: 41, vitaminB12: 0, vitaminD: 0, zinc: 1.6 }},

  { id: 'whole_moong', name: 'Whole Moong (cooked)', nameHindi: 'साबुत मूंग',
    caloriesPer100g: 105, proteinPer100g: 7.7, carbsPer100g: 18, fatPer100g: 0.6,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 1.8, calcium: 27, vitaminB12: 0, vitaminD: 0, zinc: 0.9 }},

  { id: 'black_chana', name: 'Kala Chana (cooked)', nameHindi: 'काला चना',
    caloriesPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 28, fatPer100g: 2.6,
    isVeg: true, servingUnit: 'cup', servingGrams: 180,
    microsPer100g: { iron: 3.2, calcium: 53, vitaminB12: 0, vitaminD: 0, zinc: 1.5 }},

  { id: 'lobiya', name: 'Lobiya / Black-eyed Peas (cooked)', nameHindi: 'लोबिया',
    caloriesPer100g: 116, proteinPer100g: 7.7, carbsPer100g: 21, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 180,
    microsPer100g: { iron: 2.5, calcium: 24, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'dal_makhani', name: 'Dal Makhani', nameHindi: 'दाल मखनी',
    caloriesPer100g: 140, proteinPer100g: 7, carbsPer100g: 15, fatPer100g: 6.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 2.5, calcium: 60, vitaminB12: 0.2, vitaminD: 0, zinc: 1.2 }},

  { id: 'sambar', name: 'Sambar', nameHindi: 'सांभर',
    caloriesPer100g: 45, proteinPer100g: 2, carbsPer100g: 8, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 1, calcium: 30, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  // ── Indian proteins ───────────────────────────────────

  { id: 'egg_yolk', name: 'Egg Yolk (raw)', nameHindi: 'अंडे का पीला भाग',
    caloriesPer100g: 322, proteinPer100g: 15.9, carbsPer100g: 3.6, fatPer100g: 27,
    isVeg: false, servingUnit: 'egg', servingGrams: 17,
    microsPer100g: { iron: 2.7, calcium: 129, vitaminB12: 3.8, vitaminD: 218, zinc: 2.3 }},

  { id: 'mutton_raw', name: 'Mutton (raw)', nameHindi: 'बकरे का मांस',
    caloriesPer100g: 131, proteinPer100g: 16.7, carbsPer100g: 0, fatPer100g: 6.9,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 2, calcium: 14, vitaminB12: 2.4, vitaminD: 0, zinc: 4.2 }},

  { id: 'mutton_cooked', name: 'Mutton Curry', nameHindi: 'मटन करी',
    caloriesPer100g: 170, proteinPer100g: 22, carbsPer100g: 2, fatPer100g: 8,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 2.5, calcium: 18, vitaminB12: 2.8, vitaminD: 0, zinc: 4.5 }},

  { id: 'chicken_thigh', name: 'Chicken Thigh (boneless, cooked)', nameHindi: 'चिकन जांघ',
    caloriesPer100g: 209, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 0.9, calcium: 12, vitaminB12: 0.4, vitaminD: 5, zinc: 2.8 }},

  { id: 'chicken_raw', name: 'Chicken Breast (raw)', nameHindi: 'कच्चा चिकन',
    caloriesPer100g: 120, proteinPer100g: 22.5, carbsPer100g: 0, fatPer100g: 2.6,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.6, calcium: 6, vitaminB12: 0.2, vitaminD: 2, zinc: 0.9 }},

  { id: 'rohu_fish', name: 'Rohu Fish (cooked)', nameHindi: 'रोहू मछली',
    caloriesPer100g: 97, proteinPer100g: 16, carbsPer100g: 0, fatPer100g: 3,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 1.8, calcium: 650, vitaminB12: 2, vitaminD: 60, zinc: 0.9 }},

  { id: 'hilsa_fish', name: 'Hilsa Fish (raw)', nameHindi: 'हिलसा मछली',
    caloriesPer100g: 273, proteinPer100g: 21, carbsPer100g: 0, fatPer100g: 21,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 0.6, calcium: 180, vitaminB12: 4, vitaminD: 320, zinc: 0.7 }},

  { id: 'pomfret', name: 'Pomfret (cooked)', nameHindi: 'पापलेट मछली',
    caloriesPer100g: 96, proteinPer100g: 18, carbsPer100g: 0, fatPer100g: 2.5,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 1.4, calcium: 160, vitaminB12: 3.5, vitaminD: 90, zinc: 0.8 }},

  { id: 'prawns', name: 'Prawns / Shrimp (cooked)', nameHindi: 'झींगा',
    caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.9, fatPer100g: 0.3,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 3.1, calcium: 70, vitaminB12: 1.3, vitaminD: 0, zinc: 1.3 }},

  { id: 'omelette', name: 'Omelette (2-egg, plain)', nameHindi: 'आमलेट',
    caloriesPer100g: 154, proteinPer100g: 11, carbsPer100g: 1, fatPer100g: 12,
    isVeg: false, servingUnit: 'piece', servingGrams: 100,
    microsPer100g: { iron: 1.5, calcium: 55, vitaminB12: 0.9, vitaminD: 44, zinc: 1.1 }},

  { id: 'egg_bhurji', name: 'Egg Bhurji', nameHindi: 'अंडा भुर्जी',
    caloriesPer100g: 180, proteinPer100g: 13, carbsPer100g: 3, fatPer100g: 13,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 1.8, calcium: 58, vitaminB12: 1, vitaminD: 44, zinc: 1.2 }},

  // ── Indian vegetables ────────────────────────────────

  { id: 'cauliflower', name: 'Cauliflower / Gobi (cooked)', nameHindi: 'गोभी',
    caloriesPer100g: 25, proteinPer100g: 1.8, carbsPer100g: 4.9, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 120,
    microsPer100g: { iron: 0.4, calcium: 16, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'okra', name: 'Bhindi / Okra (cooked)', nameHindi: 'भिंडी',
    caloriesPer100g: 30, proteinPer100g: 2, carbsPer100g: 6.5, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 100,
    microsPer100g: { iron: 0.6, calcium: 77, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'eggplant', name: 'Baingan / Eggplant (cooked)', nameHindi: 'बैंगन',
    caloriesPer100g: 25, proteinPer100g: 1, carbsPer100g: 5.5, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 100,
    microsPer100g: { iron: 0.2, calcium: 7, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'peas', name: 'Green Peas / Matar (cooked)', nameHindi: 'हरे मटर',
    caloriesPer100g: 84, proteinPer100g: 5.5, carbsPer100g: 14, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 120,
    microsPer100g: { iron: 1.5, calcium: 27, vitaminB12: 0, vitaminD: 0, zinc: 1.2 }},

  { id: 'carrot', name: 'Carrot (raw)', nameHindi: 'गाजर',
    caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'piece', servingGrams: 80,
    microsPer100g: { iron: 0.3, calcium: 33, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'beetroot', name: 'Beetroot (cooked)', nameHindi: 'चुकंदर',
    caloriesPer100g: 43, proteinPer100g: 1.6, carbsPer100g: 10, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'piece', servingGrams: 100,
    microsPer100g: { iron: 0.8, calcium: 16, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'bottle_gourd', name: 'Lauki / Bottle Gourd (cooked)', nameHindi: 'लौकी',
    caloriesPer100g: 15, proteinPer100g: 0.6, carbsPer100g: 3.4, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.2, calcium: 26, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'capsicum', name: 'Capsicum / Bell Pepper (raw)', nameHindi: 'शिमला मिर्च',
    caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 7.3, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'piece', servingGrams: 80,
    microsPer100g: { iron: 0.4, calcium: 7, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'onion', name: 'Onion (raw)', nameHindi: 'प्याज',
    caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'piece', servingGrams: 80,
    microsPer100g: { iron: 0.2, calcium: 23, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'tomato', name: 'Tomato (raw)', nameHindi: 'टमाटर',
    caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'piece', servingGrams: 100,
    microsPer100g: { iron: 0.3, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'cucumber', name: 'Cucumber (raw)', nameHindi: 'खीरा',
    caloriesPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'piece', servingGrams: 150,
    microsPer100g: { iron: 0.3, calcium: 16, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'methi', name: 'Methi / Fenugreek Leaves (cooked)', nameHindi: 'मेथी',
    caloriesPer100g: 49, proteinPer100g: 4.4, carbsPer100g: 6, fatPer100g: 0.9,
    isVeg: true, servingUnit: 'cup', servingGrams: 100,
    microsPer100g: { iron: 16.5, calcium: 395, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'palak_cooked', name: 'Palak / Spinach (cooked)', nameHindi: 'पकी पालक',
    caloriesPer100g: 23, proteinPer100g: 3, carbsPer100g: 3.7, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 120,
    microsPer100g: { iron: 3.6, calcium: 136, vitaminB12: 0, vitaminD: 0, zinc: 0.8 }},

  // ── Indian dishes (common logged meals) ───────────────

  { id: 'palak_paneer', name: 'Palak Paneer', nameHindi: 'पालक पनीर',
    caloriesPer100g: 168, proteinPer100g: 8, carbsPer100g: 8, fatPer100g: 12,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 1.5, calcium: 200, vitaminB12: 0.3, vitaminD: 0, zinc: 1.5 }},

  { id: 'paneer_bhurji', name: 'Paneer Bhurji', nameHindi: 'पनीर भुर्जी',
    caloriesPer100g: 220, proteinPer100g: 14, carbsPer100g: 5, fatPer100g: 16,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.5, calcium: 350, vitaminB12: 0.6, vitaminD: 0, zinc: 2 }},

  { id: 'butter_chicken', name: 'Butter Chicken (with gravy)', nameHindi: 'बटर चिकन',
    caloriesPer100g: 178, proteinPer100g: 16, carbsPer100g: 7, fatPer100g: 10,
    isVeg: false, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.8, calcium: 35, vitaminB12: 0.4, vitaminD: 0, zinc: 1.5 }},

  { id: 'chicken_biryani', name: 'Chicken Biryani', nameHindi: 'चिकन बिरयानी',
    caloriesPer100g: 185, proteinPer100g: 12, carbsPer100g: 22, fatPer100g: 5.5,
    isVeg: false, servingUnit: 'cup', servingGrams: 250,
    microsPer100g: { iron: 0.8, calcium: 25, vitaminB12: 0.3, vitaminD: 0, zinc: 1.2 }},

  { id: 'veg_biryani', name: 'Veg Biryani', nameHindi: 'वेज बिरयानी',
    caloriesPer100g: 145, proteinPer100g: 4, carbsPer100g: 28, fatPer100g: 3,
    isVeg: true, servingUnit: 'cup', servingGrams: 250,
    microsPer100g: { iron: 0.7, calcium: 22, vitaminB12: 0, vitaminD: 0, zinc: 0.7 }},

  { id: 'dal_rice', name: 'Dal Rice (combined)', nameHindi: 'दाल चावल',
    caloriesPer100g: 135, proteinPer100g: 5, carbsPer100g: 24, fatPer100g: 1.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 250,
    microsPer100g: { iron: 1, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.8 }},

  { id: 'rajma_chawal', name: 'Rajma Chawal (combined)', nameHindi: 'राजमा चावल',
    caloriesPer100g: 130, proteinPer100g: 6.5, carbsPer100g: 24, fatPer100g: 1.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 280,
    microsPer100g: { iron: 1.8, calcium: 25, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'aloo_gobi', name: 'Aloo Gobi (dry)', nameHindi: 'आलू गोभी',
    caloriesPer100g: 92, proteinPer100g: 2.3, carbsPer100g: 14, fatPer100g: 3.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 180,
    microsPer100g: { iron: 0.5, calcium: 22, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'curd_rice', name: 'Curd Rice', nameHindi: 'दही चावल',
    caloriesPer100g: 130, proteinPer100g: 4.5, carbsPer100g: 22, fatPer100g: 3,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.3, calcium: 80, vitaminB12: 0.2, vitaminD: 0, zinc: 0.5 }},

  { id: 'fried_rice', name: 'Fried Rice (veg)', nameHindi: 'फ्राइड राइस',
    caloriesPer100g: 160, proteinPer100g: 3.5, carbsPer100g: 28, fatPer100g: 4.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.5, calcium: 12, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  // ── Indian dairy (additional) ──────────────────────────

  { id: 'dahi_low_fat', name: 'Dahi Low Fat (0.5%)', nameHindi: 'कम वसा दही',
    caloriesPer100g: 45, proteinPer100g: 3.8, carbsPer100g: 5.5, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.1, calcium: 125, vitaminB12: 0.4, vitaminD: 0, zinc: 0.5 }},

  { id: 'chaas', name: 'Chaas / Buttermilk (salted)', nameHindi: 'छाछ',
    caloriesPer100g: 27, proteinPer100g: 1.8, carbsPer100g: 3.4, fatPer100g: 0.6,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.1, calcium: 116, vitaminB12: 0.2, vitaminD: 0, zinc: 0.4 }},

  { id: 'lassi_sweet', name: 'Lassi (sweet, full fat)', nameHindi: 'मीठी लस्सी',
    caloriesPer100g: 91, proteinPer100g: 3.7, carbsPer100g: 15, fatPer100g: 1.8,
    isVeg: true, servingUnit: 'cup', servingGrams: 250,
    microsPer100g: { iron: 0.1, calcium: 130, vitaminB12: 0.4, vitaminD: 0, zinc: 0.4 }},

  { id: 'ghee', name: 'Ghee', nameHindi: 'घी',
    caloriesPer100g: 900, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 99.5,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 14,
    microsPer100g: { iron: 0, calcium: 0, vitaminB12: 0, vitaminD: 0, zinc: 0 }},

  { id: 'paneer_low_fat', name: 'Paneer (low fat / skimmed)', nameHindi: 'कम वसा पनीर',
    caloriesPer100g: 180, proteinPer100g: 19, carbsPer100g: 3.8, fatPer100g: 10,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 0.3, calcium: 500, vitaminB12: 0.6, vitaminD: 0, zinc: 2 }},

  { id: 'milk_toned', name: 'Milk (toned, 1.5%)', nameHindi: 'टोंड दूध',
    caloriesPer100g: 45, proteinPer100g: 3.2, carbsPer100g: 5, fatPer100g: 1.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0, calcium: 120, vitaminB12: 0.4, vitaminD: 40, zinc: 0.4 }},

  { id: 'milk_skimmed', name: 'Milk (skimmed, 0%)', nameHindi: 'स्किम्ड दूध',
    caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0, calcium: 125, vitaminB12: 0.5, vitaminD: 40, zinc: 0.4 }},

  // ── Indian fruits ──────────────────────────────────────

  { id: 'mango', name: 'Mango (Alphonso, ripe)', nameHindi: 'आम',
    caloriesPer100g: 65, proteinPer100g: 0.6, carbsPer100g: 17, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'piece', servingGrams: 200,
    microsPer100g: { iron: 0.2, calcium: 11, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'papaya', name: 'Papaya (ripe)', nameHindi: 'पपीता',
    caloriesPer100g: 43, proteinPer100g: 0.5, carbsPer100g: 11, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.3, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'guava', name: 'Guava', nameHindi: 'अमरूद',
    caloriesPer100g: 68, proteinPer100g: 2.6, carbsPer100g: 14, fatPer100g: 1,
    isVeg: true, servingUnit: 'piece', servingGrams: 100,
    microsPer100g: { iron: 0.3, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'pomegranate', name: 'Pomegranate', nameHindi: 'अनार',
    caloriesPer100g: 83, proteinPer100g: 1.7, carbsPer100g: 19, fatPer100g: 1.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.3, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'orange', name: 'Orange', nameHindi: 'संतरा',
    caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'piece', servingGrams: 130,
    microsPer100g: { iron: 0.1, calcium: 40, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'watermelon', name: 'Watermelon', nameHindi: 'तरबूज',
    caloriesPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 7.6, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.2, calcium: 7, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'grapes', name: 'Grapes (green/black)', nameHindi: 'अंगूर',
    caloriesPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.4, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'pineapple', name: 'Pineapple (fresh)', nameHindi: 'अनानास',
    caloriesPer100g: 50, proteinPer100g: 0.5, carbsPer100g: 13, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.3, calcium: 13, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  // ── Indian snacks ─────────────────────────────────────

  { id: 'murmura', name: 'Murmura / Puffed Rice', nameHindi: 'मुरमुरा',
    caloriesPer100g: 334, proteinPer100g: 7.5, carbsPer100g: 74, fatPer100g: 1,
    isVeg: true, servingUnit: 'cup', servingGrams: 30,
    microsPer100g: { iron: 3, calcium: 12, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'roasted_chana', name: 'Roasted Chana (dry)', nameHindi: 'भुना चना',
    caloriesPer100g: 364, proteinPer100g: 22, carbsPer100g: 58, fatPer100g: 5,
    isVeg: true, servingUnit: 'g', servingGrams: 30,
    microsPer100g: { iron: 6.2, calcium: 90, vitaminB12: 0, vitaminD: 0, zinc: 3.4 }},

  { id: 'makhana', name: 'Makhana / Foxnut (plain)', nameHindi: 'मखाना',
    caloriesPer100g: 347, proteinPer100g: 9.7, carbsPer100g: 76, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 30,
    microsPer100g: { iron: 1.4, calcium: 60, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'dhokla', name: 'Dhokla (steamed)', nameHindi: 'ढोकला',
    caloriesPer100g: 77, proteinPer100g: 5, carbsPer100g: 15, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'piece', servingGrams: 50,
    microsPer100g: { iron: 0.8, calcium: 30, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'samosa', name: 'Samosa (potato, fried)', nameHindi: 'समोसा',
    caloriesPer100g: 252, proteinPer100g: 4.5, carbsPer100g: 29, fatPer100g: 13,
    isVeg: true, servingUnit: 'piece', servingGrams: 70,
    microsPer100g: { iron: 0.9, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  // ── Indian nuts & seeds ───────────────────────────────

  { id: 'cashews', name: 'Cashews', nameHindi: 'काजू',
    caloriesPer100g: 553, proteinPer100g: 18, carbsPer100g: 30, fatPer100g: 44,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 6.7, calcium: 37, vitaminB12: 0, vitaminD: 0, zinc: 5.8 }},

  { id: 'walnuts', name: 'Walnuts', nameHindi: 'अखरोट',
    caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 2.9, calcium: 98, vitaminB12: 0, vitaminD: 0, zinc: 3.1 }},

  { id: 'pistachios', name: 'Pistachios', nameHindi: 'पिस्ता',
    caloriesPer100g: 562, proteinPer100g: 20, carbsPer100g: 28, fatPer100g: 45,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 4, calcium: 105, vitaminB12: 0, vitaminD: 0, zinc: 2.2 }},

  { id: 'chia_seeds', name: 'Chia Seeds', nameHindi: 'चिया बीज',
    caloriesPer100g: 486, proteinPer100g: 17, carbsPer100g: 42, fatPer100g: 31,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 12,
    microsPer100g: { iron: 7.7, calcium: 631, vitaminB12: 0, vitaminD: 0, zinc: 4.6 }},

  { id: 'flaxseeds', name: 'Flaxseeds (ground)', nameHindi: 'अलसी',
    caloriesPer100g: 534, proteinPer100g: 18, carbsPer100g: 29, fatPer100g: 42,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 10,
    microsPer100g: { iron: 5.7, calcium: 255, vitaminB12: 0, vitaminD: 0, zinc: 4.3 }},

  { id: 'sunflower_seeds', name: 'Sunflower Seeds', nameHindi: 'सूरजमुखी के बीज',
    caloriesPer100g: 584, proteinPer100g: 21, carbsPer100g: 20, fatPer100g: 51,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 5.2, calcium: 78, vitaminB12: 0, vitaminD: 0, zinc: 5 }},

  { id: 'almond_butter', name: 'Almond Butter', nameHindi: 'बादाम मक्खन',
    caloriesPer100g: 614, proteinPer100g: 21, carbsPer100g: 19, fatPer100g: 56,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 16,
    microsPer100g: { iron: 3.5, calcium: 347, vitaminB12: 0, vitaminD: 0, zinc: 3 }},

  // ── Supplements (Indian market) ───────────────────────

  { id: 'casein_protein', name: 'Casein Protein (powder)', nameHindi: 'केसीन प्रोटीन',
    caloriesPer100g: 360, proteinPer100g: 78, carbsPer100g: 7, fatPer100g: 2,
    isVeg: false, servingUnit: 'scoop', servingGrams: 34,
    microsPer100g: { iron: 0.5, calcium: 500, vitaminB12: 0.5, vitaminD: 0, zinc: 1.5 }},

  { id: 'pea_protein', name: 'Pea Protein (powder)', nameHindi: 'पी प्रोटीन',
    caloriesPer100g: 370, proteinPer100g: 80, carbsPer100g: 6, fatPer100g: 3,
    isVeg: true, servingUnit: 'scoop', servingGrams: 30,
    microsPer100g: { iron: 8, calcium: 50, vitaminB12: 0, vitaminD: 0, zinc: 2 }},

  // ── Global proteins ────────────────────────────────────

  { id: 'chicken_raw_global', name: 'Chicken Breast (raw)', nameHindi: '',
    caloriesPer100g: 120, proteinPer100g: 22.5, carbsPer100g: 0, fatPer100g: 2.6,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.6, calcium: 6, vitaminB12: 0.2, vitaminD: 2, zinc: 0.9 }},

  { id: 'salmon_raw', name: 'Salmon (raw)', nameHindi: '',
    caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.9, calcium: 12, vitaminB12: 3.2, vitaminD: 526, zinc: 0.6 }},

  { id: 'salmon_cooked', name: 'Salmon (baked / grilled)', nameHindi: '',
    caloriesPer100g: 206, proteinPer100g: 28.8, carbsPer100g: 0, fatPer100g: 9.2,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.9, calcium: 15, vitaminB12: 4.9, vitaminD: 580, zinc: 0.7 }},

  { id: 'cod', name: 'Cod (cooked)', nameHindi: '',
    caloriesPer100g: 105, proteinPer100g: 22.8, carbsPer100g: 0, fatPer100g: 0.9,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 0.4, calcium: 18, vitaminB12: 1, vitaminD: 46, zinc: 0.5 }},

  { id: 'tilapia', name: 'Tilapia (cooked)', nameHindi: '',
    caloriesPer100g: 128, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 2.6,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 0.6, calcium: 10, vitaminB12: 2, vitaminD: 150, zinc: 0.4 }},

  { id: 'turkey_breast', name: 'Turkey Breast (roasted)', nameHindi: '',
    caloriesPer100g: 189, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 7.4,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 1.4, calcium: 21, vitaminB12: 0.3, vitaminD: 0, zinc: 3.5 }},

  { id: 'beef_lean', name: 'Beef (95% lean, cooked)', nameHindi: '',
    caloriesPer100g: 172, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 7,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 2.6, calcium: 18, vitaminB12: 2.5, vitaminD: 0, zinc: 5.4 }},

  { id: 'beef_85', name: 'Ground Beef (85% lean, cooked)', nameHindi: '',
    caloriesPer100g: 215, proteinPer100g: 24, carbsPer100g: 0, fatPer100g: 13,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 2.2, calcium: 18, vitaminB12: 2.3, vitaminD: 0, zinc: 4.8 }},

  { id: 'pork_tenderloin', name: 'Pork Tenderloin (roasted)', nameHindi: '',
    caloriesPer100g: 143, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 4,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 1, calcium: 21, vitaminB12: 0.7, vitaminD: 0, zinc: 2.4 }},

  { id: 'lamb_cooked', name: 'Lamb Leg (roasted)', nameHindi: 'मेमने का मांस',
    caloriesPer100g: 191, proteinPer100g: 28.7, carbsPer100g: 0, fatPer100g: 8,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 2.1, calcium: 15, vitaminB12: 2.6, vitaminD: 0, zinc: 5.3 }},

  { id: 'tempeh', name: 'Tempeh', nameHindi: '',
    caloriesPer100g: 193, proteinPer100g: 19, carbsPer100g: 9, fatPer100g: 11,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 2.7, calcium: 111, vitaminB12: 0, vitaminD: 0, zinc: 1.7 }},

  { id: 'edamame', name: 'Edamame (cooked)', nameHindi: '',
    caloriesPer100g: 122, proteinPer100g: 11, carbsPer100g: 10, fatPer100g: 5,
    isVeg: true, servingUnit: 'cup', servingGrams: 155,
    microsPer100g: { iron: 2.3, calcium: 63, vitaminB12: 0, vitaminD: 0, zinc: 1.4 }},

  // ── Global dairy ───────────────────────────────────────

  { id: 'greek_yogurt_0', name: 'Greek Yogurt (0% fat)', nameHindi: '',
    caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.1, calcium: 111, vitaminB12: 0.5, vitaminD: 0, zinc: 0.6 }},

  { id: 'greek_yogurt_2', name: 'Greek Yogurt (2% fat)', nameHindi: '',
    caloriesPer100g: 71, proteinPer100g: 9, carbsPer100g: 5.1, fatPer100g: 1.9,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.1, calcium: 115, vitaminB12: 0.5, vitaminD: 0, zinc: 0.6 }},

  { id: 'cheddar', name: 'Cheddar Cheese', nameHindi: '',
    caloriesPer100g: 404, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33,
    isVeg: true, servingUnit: 'slice', servingGrams: 28,
    microsPer100g: { iron: 0.7, calcium: 721, vitaminB12: 0.8, vitaminD: 12, zinc: 3.1 }},

  { id: 'mozzarella_part', name: 'Mozzarella (part skim)', nameHindi: '',
    caloriesPer100g: 280, proteinPer100g: 28, carbsPer100g: 2.2, fatPer100g: 17,
    isVeg: true, servingUnit: 'g', servingGrams: 30,
    microsPer100g: { iron: 0.2, calcium: 505, vitaminB12: 0.7, vitaminD: 0, zinc: 2.9 }},

  { id: 'milk_2pct', name: 'Milk (2% fat)', nameHindi: '',
    caloriesPer100g: 50, proteinPer100g: 3.3, carbsPer100g: 4.8, fatPer100g: 1.9,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0, calcium: 120, vitaminB12: 0.5, vitaminD: 40, zinc: 0.4 }},

  { id: 'heavy_cream', name: 'Heavy Cream', nameHindi: '',
    caloriesPer100g: 345, proteinPer100g: 2.1, carbsPer100g: 3.2, fatPer100g: 37,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 15,
    microsPer100g: { iron: 0, calcium: 65, vitaminB12: 0.1, vitaminD: 52, zinc: 0.1 }},

  // ── Global grains ──────────────────────────────────────

  { id: 'quinoa', name: 'Quinoa (cooked)', nameHindi: '',
    caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9,
    isVeg: true, servingUnit: 'cup', servingGrams: 185,
    microsPer100g: { iron: 1.5, calcium: 17, vitaminB12: 0, vitaminD: 0, zinc: 1.1 }},

  { id: 'oats_cooked', name: 'Oats (cooked / porridge)', nameHindi: '',
    caloriesPer100g: 68, proteinPer100g: 2.4, carbsPer100g: 12, fatPer100g: 1.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.7, calcium: 11, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'pasta_whole_wheat', name: 'Whole Wheat Pasta (cooked)', nameHindi: '',
    caloriesPer100g: 124, proteinPer100g: 5.3, carbsPer100g: 27, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 140,
    microsPer100g: { iron: 1.1, calcium: 21, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'pasta_white', name: 'Pasta / Spaghetti (cooked)', nameHindi: '',
    caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 27, fatPer100g: 1.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 140,
    microsPer100g: { iron: 0.9, calcium: 7, vitaminB12: 0, vitaminD: 0, zinc: 0.7 }},

  { id: 'white_bread', name: 'White Bread', nameHindi: '',
    caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 51, fatPer100g: 3.2,
    isVeg: true, servingUnit: 'slice', servingGrams: 28,
    microsPer100g: { iron: 2.4, calcium: 100, vitaminB12: 0, vitaminD: 0, zinc: 0.7 }},

  { id: 'sourdough', name: 'Sourdough Bread', nameHindi: '',
    caloriesPer100g: 264, proteinPer100g: 8.5, carbsPer100g: 51, fatPer100g: 2.4,
    isVeg: true, servingUnit: 'slice', servingGrams: 32,
    microsPer100g: { iron: 2.7, calcium: 50, vitaminB12: 0, vitaminD: 0, zinc: 0.8 }},

  { id: 'corn_kernels', name: 'Corn Kernels (cooked)', nameHindi: '',
    caloriesPer100g: 96, proteinPer100g: 3.4, carbsPer100g: 21, fatPer100g: 1.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 160,
    microsPer100g: { iron: 0.5, calcium: 2, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  // ── Global vegetables ──────────────────────────────────

  { id: 'broccoli', name: 'Broccoli (cooked)', nameHindi: '',
    caloriesPer100g: 35, proteinPer100g: 2.4, carbsPer100g: 7.2, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.7, calcium: 40, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'kale', name: 'Kale (raw)', nameHindi: '',
    caloriesPer100g: 49, proteinPer100g: 4.3, carbsPer100g: 9, fatPer100g: 0.9,
    isVeg: true, servingUnit: 'cup', servingGrams: 67,
    microsPer100g: { iron: 1.5, calcium: 135, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'mushrooms', name: 'Mushrooms (white, raw)', nameHindi: '',
    caloriesPer100g: 22, proteinPer100g: 3.1, carbsPer100g: 3.3, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 70,
    microsPer100g: { iron: 0.5, calcium: 3, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'asparagus', name: 'Asparagus (cooked)', nameHindi: '',
    caloriesPer100g: 22, proteinPer100g: 2.4, carbsPer100g: 4.1, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 2.1, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'avocado', name: 'Avocado', nameHindi: '',
    caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15,
    isVeg: true, servingUnit: 'piece', servingGrams: 200,
    microsPer100g: { iron: 0.6, calcium: 12, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'bell_pepper_red', name: 'Bell Pepper (red, raw)', nameHindi: '',
    caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 7.3, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'piece', servingGrams: 120,
    microsPer100g: { iron: 0.4, calcium: 7, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'zucchini', name: 'Zucchini / Courgette (cooked)', nameHindi: '',
    caloriesPer100g: 17, proteinPer100g: 1.2, carbsPer100g: 3.6, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 180,
    microsPer100g: { iron: 0.4, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'green_beans', name: 'Green Beans (cooked)', nameHindi: '',
    caloriesPer100g: 35, proteinPer100g: 1.9, carbsPer100g: 8, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 125,
    microsPer100g: { iron: 1.1, calcium: 55, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'celery', name: 'Celery (raw)', nameHindi: '',
    caloriesPer100g: 16, proteinPer100g: 0.7, carbsPer100g: 3, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'piece', servingGrams: 40,
    microsPer100g: { iron: 0.2, calcium: 40, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'romaine_lettuce', name: 'Romaine Lettuce', nameHindi: '',
    caloriesPer100g: 17, proteinPer100g: 1.2, carbsPer100g: 3.3, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 47,
    microsPer100g: { iron: 0.9, calcium: 33, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'cabbage', name: 'Cabbage (cooked)', nameHindi: 'पत्ता गोभी',
    caloriesPer100g: 23, proteinPer100g: 1.3, carbsPer100g: 5.4, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.2, calcium: 42, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  // ── Global fruits ──────────────────────────────────────

  { id: 'blueberries', name: 'Blueberries', nameHindi: '',
    caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 148,
    microsPer100g: { iron: 0.3, calcium: 6, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'strawberries', name: 'Strawberries', nameHindi: 'स्ट्रॉबेरी',
    caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 152,
    microsPer100g: { iron: 0.4, calcium: 16, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'kiwi', name: 'Kiwi', nameHindi: 'कीवी',
    caloriesPer100g: 61, proteinPer100g: 1.1, carbsPer100g: 15, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'piece', servingGrams: 90,
    microsPer100g: { iron: 0.3, calcium: 34, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'mango_global', name: 'Mango (ripe)', nameHindi: 'आम',
    caloriesPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 165,
    microsPer100g: { iron: 0.2, calcium: 11, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'peach', name: 'Peach', nameHindi: 'आड़ू',
    caloriesPer100g: 39, proteinPer100g: 0.9, carbsPer100g: 9.5, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'piece', servingGrams: 150,
    microsPer100g: { iron: 0.3, calcium: 6, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'raspberries', name: 'Raspberries', nameHindi: '',
    caloriesPer100g: 52, proteinPer100g: 1.2, carbsPer100g: 12, fatPer100g: 0.7,
    isVeg: true, servingUnit: 'cup', servingGrams: 123,
    microsPer100g: { iron: 0.7, calcium: 25, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'cherries', name: 'Cherries', nameHindi: '',
    caloriesPer100g: 63, proteinPer100g: 1.1, carbsPer100g: 16, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 138,
    microsPer100g: { iron: 0.4, calcium: 13, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  // ── Global nuts & seeds ────────────────────────────────

  { id: 'hemp_seeds', name: 'Hemp Seeds', nameHindi: '',
    caloriesPer100g: 553, proteinPer100g: 32, carbsPer100g: 8.7, fatPer100g: 49,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 10,
    microsPer100g: { iron: 8, calcium: 70, vitaminB12: 0, vitaminD: 0, zinc: 9.9 }},

  // ── Global legumes ─────────────────────────────────────

  { id: 'black_beans', name: 'Black Beans (cooked)', nameHindi: '',
    caloriesPer100g: 132, proteinPer100g: 8.9, carbsPer100g: 24, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 172,
    microsPer100g: { iron: 2.1, calcium: 27, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'lentils_green', name: 'Lentils (green, cooked)', nameHindi: '',
    caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 198,
    microsPer100g: { iron: 3.3, calcium: 19, vitaminB12: 0, vitaminD: 0, zinc: 1.3 }},

  { id: 'chickpeas', name: 'Chickpeas / Garbanzo (cooked)', nameHindi: 'उबले छोले',
    caloriesPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27, fatPer100g: 2.6,
    isVeg: true, servingUnit: 'cup', servingGrams: 164,
    microsPer100g: { iron: 2.9, calcium: 49, vitaminB12: 0, vitaminD: 0, zinc: 1.5 }},

  { id: 'kidney_beans', name: 'Kidney Beans (cooked)', nameHindi: 'राजमा',
    caloriesPer100g: 127, proteinPer100g: 8.7, carbsPer100g: 22, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 177,
    microsPer100g: { iron: 2.9, calcium: 28, vitaminB12: 0, vitaminD: 0, zinc: 1.4 }},

  // ── Packaged / processed (global) ─────────────────────

  { id: 'dark_chocolate_70', name: 'Dark Chocolate (70-85%)', nameHindi: 'डार्क चॉकलेट',
    caloriesPer100g: 598, proteinPer100g: 7.8, carbsPer100g: 46, fatPer100g: 43,
    isVeg: true, servingUnit: 'g', servingGrams: 30,
    microsPer100g: { iron: 11.9, calcium: 73, vitaminB12: 0, vitaminD: 0, zinc: 3.3 }},

  { id: 'protein_bar_generic', name: 'Protein Bar (generic ~200kcal)', nameHindi: 'प्रोटीन बार',
    caloriesPer100g: 370, proteinPer100g: 27, carbsPer100g: 43, fatPer100g: 9,
    isVeg: false, servingUnit: 'piece', servingGrams: 60,
    microsPer100g: { iron: 3, calcium: 200, vitaminB12: 0.5, vitaminD: 0, zinc: 2 }},

  { id: 'granola', name: 'Granola (oats & honey)', nameHindi: 'ग्रेनोला',
    caloriesPer100g: 421, proteinPer100g: 9.4, carbsPer100g: 64, fatPer100g: 15,
    isVeg: true, servingUnit: 'cup', servingGrams: 60,
    microsPer100g: { iron: 3.4, calcium: 44, vitaminB12: 0, vitaminD: 0, zinc: 2.5 }},

  { id: 'coconut_water', name: 'Coconut Water (fresh)', nameHindi: 'नारियल पानी',
    caloriesPer100g: 19, proteinPer100g: 0.7, carbsPer100g: 3.7, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.3, calcium: 24, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'almond_milk', name: 'Almond Milk (unsweetened)', nameHindi: '',
    caloriesPer100g: 15, proteinPer100g: 0.6, carbsPer100g: 0.6, fatPer100g: 1.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.4, calcium: 188, vitaminB12: 0, vitaminD: 41, zinc: 0.2 }},

  { id: 'oat_milk', name: 'Oat Milk (original)', nameHindi: '',
    caloriesPer100g: 45, proteinPer100g: 1, carbsPer100g: 7.4, fatPer100g: 1.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.2, calcium: 120, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'orange_juice', name: 'Orange Juice (fresh)', nameHindi: 'संतरे का रस',
    caloriesPer100g: 45, proteinPer100g: 0.7, carbsPer100g: 10, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.2, calcium: 11, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  // ── Indian packaged staples ────────────────────────────

  { id: 'glucose_biscuit', name: 'Glucose Biscuits (Parle-G type)', nameHindi: 'ग्लूकोज बिस्किट',
    caloriesPer100g: 441, proteinPer100g: 6.7, carbsPer100g: 73, fatPer100g: 14,
    isVeg: true, servingUnit: 'piece', servingGrams: 7,
    microsPer100g: { iron: 2.5, calcium: 50, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'marie_biscuit', name: 'Marie Biscuits', nameHindi: 'मैरी बिस्किट',
    caloriesPer100g: 423, proteinPer100g: 7.7, carbsPer100g: 74, fatPer100g: 11,
    isVeg: true, servingUnit: 'piece', servingGrams: 6,
    microsPer100g: { iron: 2.2, calcium: 55, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'chyawanprash', name: 'Chyawanprash', nameHindi: 'च्यवनप्राश',
    caloriesPer100g: 360, proteinPer100g: 1.5, carbsPer100g: 73, fatPer100g: 7,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 12,
    microsPer100g: { iron: 0, calcium: 0, vitaminB12: 0, vitaminD: 0, zinc: 0 }},

  // ── Indian street food & common dishes ───────────────

  { id: 'vada_pav', name: 'Vada Pav', nameHindi: 'वड़ा पाव',
    caloriesPer100g: 244, proteinPer100g: 6, carbsPer100g: 34, fatPer100g: 10,
    isVeg: true, servingUnit: 'piece', servingGrams: 100,
    microsPer100g: { iron: 1.2, calcium: 25, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'pav_bhaji', name: 'Pav Bhaji (bhaji only)', nameHindi: 'पाव भाजी',
    caloriesPer100g: 130, proteinPer100g: 4, carbsPer100g: 18, fatPer100g: 5.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.8, calcium: 35, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'bhel_puri', name: 'Bhel Puri', nameHindi: 'भेल पूरी',
    caloriesPer100g: 200, proteinPer100g: 5.5, carbsPer100g: 35, fatPer100g: 5.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 100,
    microsPer100g: { iron: 1.5, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'panipuri', name: 'Pani Puri / Golgappa', nameHindi: 'पानी पूरी',
    caloriesPer100g: 222, proteinPer100g: 5, carbsPer100g: 38, fatPer100g: 6,
    isVeg: true, servingUnit: 'piece', servingGrams: 20,
    microsPer100g: { iron: 1, calcium: 15, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'chole_bhature', name: 'Chole Bhature (1 bhatura + chole)', nameHindi: 'छोले भटूरे',
    caloriesPer100g: 260, proteinPer100g: 7.5, carbsPer100g: 35, fatPer100g: 11,
    isVeg: true, servingUnit: 'piece', servingGrams: 150,
    microsPer100g: { iron: 2, calcium: 40, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'medu_vada', name: 'Medu Vada', nameHindi: 'मेदू वड़ा',
    caloriesPer100g: 225, proteinPer100g: 7.5, carbsPer100g: 27, fatPer100g: 9.5,
    isVeg: true, servingUnit: 'piece', servingGrams: 50,
    microsPer100g: { iron: 1.2, calcium: 28, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'rava_dosa', name: 'Rava Dosa (crispy)', nameHindi: 'रवा डोसा',
    caloriesPer100g: 195, proteinPer100g: 4.5, carbsPer100g: 32, fatPer100g: 5.5,
    isVeg: true, servingUnit: 'dosa', servingGrams: 90,
    microsPer100g: { iron: 0.8, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'masala_dosa', name: 'Masala Dosa (with potato filling)', nameHindi: 'मसाला डोसा',
    caloriesPer100g: 186, proteinPer100g: 4, carbsPer100g: 30, fatPer100g: 5.5,
    isVeg: true, servingUnit: 'dosa', servingGrams: 130,
    microsPer100g: { iron: 0.8, calcium: 22, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'pongal', name: 'Ven Pongal (rice & moong)', nameHindi: 'पोंगल',
    caloriesPer100g: 130, proteinPer100g: 4.5, carbsPer100g: 22, fatPer100g: 4,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.8, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'dahi_vada', name: 'Dahi Vada', nameHindi: 'दही वड़ा',
    caloriesPer100g: 148, proteinPer100g: 6, carbsPer100g: 20, fatPer100g: 5,
    isVeg: true, servingUnit: 'piece', servingGrams: 90,
    microsPer100g: { iron: 0.8, calcium: 80, vitaminB12: 0.2, vitaminD: 0, zinc: 0.6 }},

  { id: 'shrikhand', name: 'Shrikhand', nameHindi: 'श्रीखंड',
    caloriesPer100g: 200, proteinPer100g: 5.5, carbsPer100g: 33, fatPer100g: 5,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 0.1, calcium: 150, vitaminB12: 0.4, vitaminD: 0, zinc: 0.5 }},

  { id: 'kadhi', name: 'Kadhi (with pakora)', nameHindi: 'कढ़ी',
    caloriesPer100g: 96, proteinPer100g: 3, carbsPer100g: 10, fatPer100g: 5,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.5, calcium: 88, vitaminB12: 0.2, vitaminD: 0, zinc: 0.4 }},

  { id: 'baingan_bharta', name: 'Baingan Bharta (roasted eggplant)', nameHindi: 'बैंगन भरता',
    caloriesPer100g: 66, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 3,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.4, calcium: 22, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'malai_kofta', name: 'Malai Kofta (with gravy)', nameHindi: 'मलाई कोफ्ता',
    caloriesPer100g: 195, proteinPer100g: 6, carbsPer100g: 12, fatPer100g: 14,
    isVeg: true, servingUnit: 'piece', servingGrams: 150,
    microsPer100g: { iron: 0.5, calcium: 120, vitaminB12: 0.3, vitaminD: 0, zinc: 0.8 }},

  { id: 'tandoori_chicken', name: 'Tandoori Chicken', nameHindi: 'तंदूरी चिकन',
    caloriesPer100g: 180, proteinPer100g: 28, carbsPer100g: 3, fatPer100g: 6.5,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.9, calcium: 20, vitaminB12: 0.5, vitaminD: 0, zinc: 2 }},

  { id: 'chicken_tikka', name: 'Chicken Tikka (grilled)', nameHindi: 'चिकन टिक्का',
    caloriesPer100g: 185, proteinPer100g: 27, carbsPer100g: 4, fatPer100g: 7,
    isVeg: false, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 1, calcium: 22, vitaminB12: 0.4, vitaminD: 0, zinc: 2 }},

  { id: 'egg_curry', name: 'Egg Curry (2 eggs + gravy)', nameHindi: 'अंडा करी',
    caloriesPer100g: 150, proteinPer100g: 9, carbsPer100g: 6, fatPer100g: 10,
    isVeg: false, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 1.3, calcium: 60, vitaminB12: 0.8, vitaminD: 40, zinc: 1.2 }},

  { id: 'fish_curry', name: 'Fish Curry (with gravy)', nameHindi: 'मछली करी',
    caloriesPer100g: 140, proteinPer100g: 15, carbsPer100g: 5, fatPer100g: 7,
    isVeg: false, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 1.5, calcium: 120, vitaminB12: 2, vitaminD: 50, zinc: 0.8 }},

  { id: 'halwa_suji', name: 'Suji Halwa (semolina)', nameHindi: 'सूजी हलवा',
    caloriesPer100g: 204, proteinPer100g: 3.5, carbsPer100g: 35, fatPer100g: 6,
    isVeg: true, servingUnit: 'cup', servingGrams: 100,
    microsPer100g: { iron: 1, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'kheer', name: 'Kheer (rice pudding)', nameHindi: 'खीर',
    caloriesPer100g: 120, proteinPer100g: 3.5, carbsPer100g: 20, fatPer100g: 3,
    isVeg: true, servingUnit: 'cup', servingGrams: 200,
    microsPer100g: { iron: 0.3, calcium: 130, vitaminB12: 0.4, vitaminD: 35, zinc: 0.4 }},

  { id: 'gulab_jamun', name: 'Gulab Jamun (1 piece)', nameHindi: 'गुलाब जामुन',
    caloriesPer100g: 314, proteinPer100g: 4.5, carbsPer100g: 55, fatPer100g: 9,
    isVeg: true, servingUnit: 'piece', servingGrams: 40,
    microsPer100g: { iron: 0.2, calcium: 55, vitaminB12: 0.1, vitaminD: 0, zinc: 0.2 }},

  { id: 'ladoo_besan', name: 'Besan Ladoo', nameHindi: 'बेसन लड्डू',
    caloriesPer100g: 460, proteinPer100g: 9, carbsPer100g: 57, fatPer100g: 22,
    isVeg: true, servingUnit: 'piece', servingGrams: 40,
    microsPer100g: { iron: 3, calcium: 40, vitaminB12: 0, vitaminD: 0, zinc: 1.2 }},

  // ── More Indian grains & carb staples ─────────────────

  { id: 'ragi_flour', name: 'Ragi / Finger Millet (flour)', nameHindi: 'रागी',
    caloriesPer100g: 328, proteinPer100g: 7.3, carbsPer100g: 72, fatPer100g: 1.5,
    isVeg: true, servingUnit: 'g', servingGrams: 40,
    microsPer100g: { iron: 3.9, calcium: 344, vitaminB12: 0, vitaminD: 0, zinc: 2.5 }},

  { id: 'sabudana', name: 'Sabudana / Tapioca (cooked)', nameHindi: 'साबूदाना',
    caloriesPer100g: 94, proteinPer100g: 0.2, carbsPer100g: 23, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.2, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'suji', name: 'Suji / Semolina (raw)', nameHindi: 'सूजी',
    caloriesPer100g: 360, proteinPer100g: 12, carbsPer100g: 73, fatPer100g: 1.2,
    isVeg: true, servingUnit: 'g', servingGrams: 50,
    microsPer100g: { iron: 3.8, calcium: 17, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'besan', name: 'Besan / Gram Flour (raw)', nameHindi: 'बेसन',
    caloriesPer100g: 387, proteinPer100g: 22, carbsPer100g: 58, fatPer100g: 6,
    isVeg: true, servingUnit: 'g', servingGrams: 50,
    microsPer100g: { iron: 6.3, calcium: 45, vitaminB12: 0, vitaminD: 0, zinc: 2.9 }},

  { id: 'wheat_flour', name: 'Wheat Flour (atta, whole wheat)', nameHindi: 'गेहूं का आटा',
    caloriesPer100g: 340, proteinPer100g: 11, carbsPer100g: 68, fatPer100g: 1.5,
    isVeg: true, servingUnit: 'g', servingGrams: 50,
    microsPer100g: { iron: 3.9, calcium: 48, vitaminB12: 0, vitaminD: 0, zinc: 2.8 }},

  { id: 'maida', name: 'Maida / All-purpose Flour', nameHindi: 'मैदा',
    caloriesPer100g: 360, proteinPer100g: 10, carbsPer100g: 76, fatPer100g: 0.9,
    isVeg: true, servingUnit: 'g', servingGrams: 50,
    microsPer100g: { iron: 2.7, calcium: 16, vitaminB12: 0, vitaminD: 0, zinc: 0.8 }},

  // ── More Indian proteins ──────────────────────────────

  { id: 'chicken_kebab', name: 'Chicken Seekh Kebab', nameHindi: 'चिकन सीख कबाब',
    caloriesPer100g: 200, proteinPer100g: 22, carbsPer100g: 5, fatPer100g: 10,
    isVeg: false, servingUnit: 'piece', servingGrams: 60,
    microsPer100g: { iron: 1, calcium: 18, vitaminB12: 0.3, vitaminD: 0, zinc: 2 }},

  { id: 'keema', name: 'Mutton Keema (cooked)', nameHindi: 'कीमा',
    caloriesPer100g: 196, proteinPer100g: 20, carbsPer100g: 4, fatPer100g: 11,
    isVeg: false, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 2.5, calcium: 20, vitaminB12: 2.5, vitaminD: 0, zinc: 4 }},

  { id: 'soya_milk', name: 'Soy Milk (plain, unsweetened)', nameHindi: 'सोया दूध',
    caloriesPer100g: 33, proteinPer100g: 3.3, carbsPer100g: 1.7, fatPer100g: 1.8,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.6, calcium: 25, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'sardines', name: 'Sardines (canned in oil, drained)', nameHindi: 'सार्डिन',
    caloriesPer100g: 208, proteinPer100g: 24.6, carbsPer100g: 0, fatPer100g: 11.5,
    isVeg: false, servingUnit: 'g', servingGrams: 85,
    microsPer100g: { iron: 2.9, calcium: 382, vitaminB12: 8.9, vitaminD: 272, zinc: 1.3 }},

  // ── More vegetables ───────────────────────────────────

  { id: 'bitter_gourd', name: 'Karela / Bitter Gourd (cooked)', nameHindi: 'करेला',
    caloriesPer100g: 17, proteinPer100g: 1, carbsPer100g: 3.7, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 100,
    microsPer100g: { iron: 0.4, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'drumstick', name: 'Drumstick / Sahjan (cooked)', nameHindi: 'सहजन',
    caloriesPer100g: 37, proteinPer100g: 2.1, carbsPer100g: 8.5, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 100,
    microsPer100g: { iron: 0.4, calcium: 30, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'raw_banana', name: 'Raw Banana / Kachcha Kela (cooked)', nameHindi: 'कच्चा केला',
    caloriesPer100g: 89, proteinPer100g: 1.3, carbsPer100g: 22, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'piece', servingGrams: 100,
    microsPer100g: { iron: 0.3, calcium: 6, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'brinjal_stuffed', name: 'Bharwa Baingan (stuffed eggplant)', nameHindi: 'भरवां बैंगन',
    caloriesPer100g: 88, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 5,
    isVeg: true, servingUnit: 'piece', servingGrams: 120,
    microsPer100g: { iron: 0.4, calcium: 15, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'arbi', name: 'Arbi / Colocasia (cooked)', nameHindi: 'अरबी',
    caloriesPer100g: 142, proteinPer100g: 2, carbsPer100g: 33, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.5, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'kaddu', name: 'Kaddu / Pumpkin (cooked)', nameHindi: 'कद्दू',
    caloriesPer100g: 26, proteinPer100g: 1, carbsPer100g: 6.5, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0.5, calcium: 21, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'corn_bhutta', name: 'Corn / Bhutta (roasted, on cob)', nameHindi: 'भुट्टा',
    caloriesPer100g: 99, proteinPer100g: 3.4, carbsPer100g: 21, fatPer100g: 1.4,
    isVeg: true, servingUnit: 'piece', servingGrams: 100,
    microsPer100g: { iron: 0.5, calcium: 2, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'yam', name: 'Suran / Yam (cooked)', nameHindi: 'सूरन',
    caloriesPer100g: 118, proteinPer100g: 1.5, carbsPer100g: 27, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 0.5, calcium: 17, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  // ── More snacks & packed foods ────────────────────────

  { id: 'namkeen_mixture', name: 'Namkeen / Chivda Mixture', nameHindi: 'नमकीन',
    caloriesPer100g: 480, proteinPer100g: 10, carbsPer100g: 60, fatPer100g: 22,
    isVeg: true, servingUnit: 'g', servingGrams: 30,
    microsPer100g: { iron: 1.5, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'mathri', name: 'Mathri (plain, fried)', nameHindi: 'मठरी',
    caloriesPer100g: 495, proteinPer100g: 8, carbsPer100g: 60, fatPer100g: 25,
    isVeg: true, servingUnit: 'piece', servingGrams: 12,
    microsPer100g: { iron: 1.5, calcium: 15, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'kachori', name: 'Kachori (masala, fried)', nameHindi: 'कचोरी',
    caloriesPer100g: 335, proteinPer100g: 6.5, carbsPer100g: 40, fatPer100g: 17,
    isVeg: true, servingUnit: 'piece', servingGrams: 60,
    microsPer100g: { iron: 1.2, calcium: 22, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'sev', name: 'Sev / Bhujia (plain)', nameHindi: 'सेव',
    caloriesPer100g: 545, proteinPer100g: 14, carbsPer100g: 58, fatPer100g: 29,
    isVeg: true, servingUnit: 'g', servingGrams: 20,
    microsPer100g: { iron: 4, calcium: 40, vitaminB12: 0, vitaminD: 0, zinc: 1.2 }},

  { id: 'banana_chips', name: 'Banana Chips (fried)', nameHindi: 'केले के चिप्स',
    caloriesPer100g: 519, proteinPer100g: 2.3, carbsPer100g: 58, fatPer100g: 34,
    isVeg: true, servingUnit: 'g', servingGrams: 30,
    microsPer100g: { iron: 0.6, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'potato_chips', name: 'Potato Chips (plain, salted)', nameHindi: 'आलू चिप्स',
    caloriesPer100g: 542, proteinPer100g: 6.5, carbsPer100g: 53, fatPer100g: 35,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 1, calcium: 14, vitaminB12: 0, vitaminD: 0, zinc: 0.8 }},

  { id: 'digestive_biscuit', name: 'Digestive Biscuits', nameHindi: 'डाइजेस्टिव बिस्किट',
    caloriesPer100g: 477, proteinPer100g: 7, carbsPer100g: 65, fatPer100g: 21,
    isVeg: true, servingUnit: 'piece', servingGrams: 14,
    microsPer100g: { iron: 2.5, calcium: 50, vitaminB12: 0, vitaminD: 0, zinc: 0.8 }},

  { id: 'choco_biscuit', name: 'Chocolate Cream Biscuits (Oreo type)', nameHindi: 'चॉकलेट क्रीम बिस्किट',
    caloriesPer100g: 471, proteinPer100g: 5, carbsPer100g: 71, fatPer100g: 20,
    isVeg: true, servingUnit: 'piece', servingGrams: 11,
    microsPer100g: { iron: 3, calcium: 16, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  // ── Condiments & cooking staples ──────────────────────

  { id: 'coconut_milk', name: 'Coconut Milk (canned, full fat)', nameHindi: 'नारियल दूध',
    caloriesPer100g: 197, proteinPer100g: 2, carbsPer100g: 3, fatPer100g: 21,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 1.6, calcium: 16, vitaminB12: 0, vitaminD: 0, zinc: 0.7 }},

  { id: 'tamarind', name: 'Tamarind paste (imli)', nameHindi: 'इमली',
    caloriesPer100g: 239, proteinPer100g: 2.8, carbsPer100g: 63, fatPer100g: 0.6,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 18,
    microsPer100g: { iron: 2.8, calcium: 74, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'sugar', name: 'Sugar (white)', nameHindi: 'चीनी',
    caloriesPer100g: 387, proteinPer100g: 0, carbsPer100g: 100, fatPer100g: 0,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 12,
    microsPer100g: { iron: 0, calcium: 1, vitaminB12: 0, vitaminD: 0, zinc: 0 }},

  { id: 'jaggery', name: 'Jaggery / Gud', nameHindi: 'गुड़',
    caloriesPer100g: 357, proteinPer100g: 0.4, carbsPer100g: 89, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 12,
    microsPer100g: { iron: 11, calcium: 80, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'honey', name: 'Honey', nameHindi: 'शहद',
    caloriesPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82, fatPer100g: 0,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 21,
    microsPer100g: { iron: 0.4, calcium: 6, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  // ── More supplements & gym foods ─────────────────────

  { id: 'bcaa_powder', name: 'BCAA Powder (10g serving)', nameHindi: 'बीसीएए',
    caloriesPer100g: 40, proteinPer100g: 10, carbsPer100g: 0, fatPer100g: 0,
    isVeg: false, servingUnit: 'g', servingGrams: 10,
    microsPer100g: { iron: 0, calcium: 0, vitaminB12: 0, vitaminD: 0, zinc: 0 }},

  { id: 'creatine', name: 'Creatine Monohydrate (5g serving)', nameHindi: 'क्रिएटिन',
    caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0,
    isVeg: true, servingUnit: 'g', servingGrams: 5,
    microsPer100g: { iron: 0, calcium: 0, vitaminB12: 0, vitaminD: 0, zinc: 0 }},

  { id: 'vegan_protein', name: 'Vegan Protein Blend (powder)', nameHindi: 'वीगन प्रोटीन',
    caloriesPer100g: 370, proteinPer100g: 76, carbsPer100g: 8, fatPer100g: 4,
    isVeg: true, servingUnit: 'scoop', servingGrams: 30,
    microsPer100g: { iron: 5, calcium: 80, vitaminB12: 0, vitaminD: 0, zinc: 2 }},

  { id: 'mass_gainer', name: 'Mass Gainer (1 serving, ~80g)', nameHindi: 'मास गेनर',
    caloriesPer100g: 380, proteinPer100g: 16, carbsPer100g: 74, fatPer100g: 3,
    isVeg: false, servingUnit: 'g', servingGrams: 80,
    microsPer100g: { iron: 3, calcium: 200, vitaminB12: 0.5, vitaminD: 0, zinc: 1.5 }},

  // ── More global foods ──────────────────────────────────

  { id: 'hummus', name: 'Hummus', nameHindi: '',
    caloriesPer100g: 166, proteinPer100g: 7.9, carbsPer100g: 14, fatPer100g: 9.6,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 30,
    microsPer100g: { iron: 2.4, calcium: 49, vitaminB12: 0, vitaminD: 0, zinc: 1.5 }},

  { id: 'pizza_margherita', name: 'Pizza (margherita, 1 slice)', nameHindi: '',
    caloriesPer100g: 266, proteinPer100g: 11, carbsPer100g: 33, fatPer100g: 10,
    isVeg: true, servingUnit: 'slice', servingGrams: 100,
    microsPer100g: { iron: 1.8, calcium: 130, vitaminB12: 0.2, vitaminD: 0, zinc: 0.8 }},

  { id: 'burger_veg', name: 'Veggie Burger (with bun)', nameHindi: '',
    caloriesPer100g: 240, proteinPer100g: 9, carbsPer100g: 32, fatPer100g: 9,
    isVeg: true, servingUnit: 'piece', servingGrams: 200,
    microsPer100g: { iron: 2, calcium: 80, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'burger_chicken', name: 'Chicken Burger (with bun)', nameHindi: '',
    caloriesPer100g: 278, proteinPer100g: 15, carbsPer100g: 28, fatPer100g: 12,
    isVeg: false, servingUnit: 'piece', servingGrams: 200,
    microsPer100g: { iron: 2.2, calcium: 85, vitaminB12: 0.3, vitaminD: 0, zinc: 1.5 }},

  { id: 'french_fries', name: 'French Fries (medium, restaurant)', nameHindi: '',
    caloriesPer100g: 312, proteinPer100g: 3.4, carbsPer100g: 41, fatPer100g: 15,
    isVeg: true, servingUnit: 'g', servingGrams: 117,
    microsPer100g: { iron: 0.8, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'fried_egg', name: 'Egg (fried, in butter)', nameHindi: 'तला अंडा',
    caloriesPer100g: 196, proteinPer100g: 13.6, carbsPer100g: 0.9, fatPer100g: 15,
    isVeg: false, servingUnit: 'egg', servingGrams: 50,
    microsPer100g: { iron: 1.4, calcium: 43, vitaminB12: 0.9, vitaminD: 44, zinc: 1.1 }},

  { id: 'boiled_egg', name: 'Egg (hard boiled)', nameHindi: 'उबला अंडा',
    caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11,
    isVeg: false, servingUnit: 'egg', servingGrams: 50,
    microsPer100g: { iron: 1.2, calcium: 50, vitaminB12: 0.9, vitaminD: 44, zinc: 1.1 }},

  { id: 'scrambled_eggs', name: 'Scrambled Eggs (plain)', nameHindi: 'अंडा स्क्रैम्बल',
    caloriesPer100g: 149, proteinPer100g: 10.1, carbsPer100g: 1.6, fatPer100g: 11,
    isVeg: false, servingUnit: 'egg', servingGrams: 100,
    microsPer100g: { iron: 1.2, calcium: 54, vitaminB12: 0.8, vitaminD: 44, zinc: 1.1 }},

  // ── Beverages (common tracked) ─────────────────────────

  { id: 'masala_chai', name: 'Masala Chai (with milk & sugar)', nameHindi: 'मसाला चाय',
    caloriesPer100g: 40, proteinPer100g: 1.5, carbsPer100g: 6, fatPer100g: 1.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 150,
    microsPer100g: { iron: 0, calcium: 55, vitaminB12: 0.2, vitaminD: 12, zinc: 0.1 }},

  { id: 'black_coffee', name: 'Black Coffee (brewed)', nameHindi: 'ब्लैक कॉफ़ी',
    caloriesPer100g: 2, proteinPer100g: 0.3, carbsPer100g: 0, fatPer100g: 0,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0, calcium: 2, vitaminB12: 0, vitaminD: 0, zinc: 0 }},

  { id: 'protein_shake_milk', name: 'Protein Shake (whey + 250ml milk)', nameHindi: '',
    caloriesPer100g: 92, proteinPer100g: 11.5, carbsPer100g: 6.5, fatPer100g: 2,
    isVeg: false, servingUnit: 'cup', servingGrams: 300,
    microsPer100g: { iron: 0.3, calcium: 145, vitaminB12: 0.7, vitaminD: 50, zinc: 0.7 }},

  // ── Egg variations ────────────────────────────────────
  { id: 'egg_white', name: 'Egg Whites (raw)', nameHindi: '',
    caloriesPer100g: 52, proteinPer100g: 10.9, carbsPer100g: 0.7, fatPer100g: 0.2,
    isVeg: false, servingUnit: 'g', servingGrams: 33,
    microsPer100g: { iron: 0.1, calcium: 7, vitaminB12: 0.1, vitaminD: 0, zinc: 0 }},

  { id: 'egg_white_cooked', name: 'Egg Whites (cooked)', nameHindi: '',
    caloriesPer100g: 50, proteinPer100g: 10.6, carbsPer100g: 0.5, fatPer100g: 0.1,
    isVeg: false, servingUnit: 'g', servingGrams: 33,
    microsPer100g: { iron: 0.1, calcium: 7, vitaminB12: 0.1, vitaminD: 0, zinc: 0 }},

  { id: 'egg_yolk', name: 'Egg Yolk', nameHindi: '',
    caloriesPer100g: 322, proteinPer100g: 15.9, carbsPer100g: 1.8, fatPer100g: 26.5,
    isVeg: false, servingUnit: 'g', servingGrams: 17,
    microsPer100g: { iron: 2.7, calcium: 129, vitaminB12: 1.9, vitaminD: 218, zinc: 2.3 }},

  { id: 'fried_egg', name: 'Fried Egg', nameHindi: '',
    caloriesPer100g: 196, proteinPer100g: 13.6, carbsPer100g: 0.8, fatPer100g: 14.8,
    isVeg: false, servingUnit: 'egg', servingGrams: 46,
    microsPer100g: { iron: 1.4, calcium: 47, vitaminB12: 0.9, vitaminD: 44, zinc: 1.3 }},

  { id: 'boiled_egg', name: 'Hard-Boiled Egg', nameHindi: 'उबला अंडा',
    caloriesPer100g: 155, proteinPer100g: 12.6, carbsPer100g: 1.1, fatPer100g: 10.6,
    isVeg: false, servingUnit: 'egg', servingGrams: 50,
    microsPer100g: { iron: 1.2, calcium: 50, vitaminB12: 0.9, vitaminD: 44, zinc: 1.1 }},

  { id: 'scrambled_eggs', name: 'Scrambled Eggs', nameHindi: '',
    caloriesPer100g: 149, proteinPer100g: 10.1, carbsPer100g: 1.2, fatPer100g: 11.2,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 1.2, calcium: 70, vitaminB12: 0.7, vitaminD: 40, zinc: 1 }},

  { id: 'poached_egg', name: 'Poached Egg', nameHindi: '',
    caloriesPer100g: 143, proteinPer100g: 12.5, carbsPer100g: 0.7, fatPer100g: 9.5,
    isVeg: false, servingUnit: 'egg', servingGrams: 50,
    microsPer100g: { iron: 1.2, calcium: 47, vitaminB12: 0.9, vitaminD: 44, zinc: 1 }},

  // ── Global poultry & meat ─────────────────────────────
  { id: 'turkey_breast', name: 'Turkey Breast (cooked)', nameHindi: '',
    caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 1.2, calcium: 18, vitaminB12: 0.5, vitaminD: 0, zinc: 2.1 }},

  { id: 'turkey_mince', name: 'Ground Turkey (lean, cooked)', nameHindi: '',
    caloriesPer100g: 149, proteinPer100g: 27, carbsPer100g: 0, fatPer100g: 4,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 1.5, calcium: 20, vitaminB12: 0.4, vitaminD: 0, zinc: 2.5 }},

  { id: 'lean_ground_beef', name: 'Ground Beef 90/10 (cooked)', nameHindi: '',
    caloriesPer100g: 215, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 12,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 2.6, calcium: 18, vitaminB12: 2.5, vitaminD: 0, zinc: 5 }},

  { id: 'sirloin_steak', name: 'Beef Sirloin Steak (cooked)', nameHindi: '',
    caloriesPer100g: 207, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 2.7, calcium: 13, vitaminB12: 2.5, vitaminD: 0, zinc: 5.8 }},

  { id: 'pork_tenderloin', name: 'Pork Tenderloin (cooked)', nameHindi: '',
    caloriesPer100g: 166, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 6,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 1.2, calcium: 13, vitaminB12: 0.7, vitaminD: 0, zinc: 2.5 }},

  { id: 'lamb_leg', name: 'Lamb Leg (cooked)', nameHindi: 'भेड़ का मांस',
    caloriesPer100g: 191, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 10,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 2.4, calcium: 14, vitaminB12: 2.6, vitaminD: 0, zinc: 4.2 }},

  { id: 'deli_ham', name: 'Ham (deli sliced)', nameHindi: '',
    caloriesPer100g: 110, proteinPer100g: 16.5, carbsPer100g: 1.5, fatPer100g: 4,
    isVeg: false, servingUnit: 'slice', servingGrams: 28,
    microsPer100g: { iron: 0.7, calcium: 7, vitaminB12: 0.4, vitaminD: 0, zinc: 1.3 }},

  { id: 'chicken_thigh', name: 'Chicken Thigh (cooked, skinless)', nameHindi: '',
    caloriesPer100g: 179, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 8.5,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 1.1, calcium: 12, vitaminB12: 0.3, vitaminD: 4, zinc: 2 }},

  { id: 'chicken_wings', name: 'Chicken Wings (cooked)', nameHindi: '',
    caloriesPer100g: 266, proteinPer100g: 27, carbsPer100g: 0, fatPer100g: 18,
    isVeg: false, servingUnit: 'piece', servingGrams: 34,
    microsPer100g: { iron: 1, calcium: 15, vitaminB12: 0.3, vitaminD: 4, zinc: 2.2 }},

  // ── Fish & seafood ────────────────────────────────────
  { id: 'tuna_canned_water', name: 'Tuna (canned in water)', nameHindi: '',
    caloriesPer100g: 86, proteinPer100g: 19, carbsPer100g: 0, fatPer100g: 0.6,
    isVeg: false, servingUnit: 'g', servingGrams: 85,
    microsPer100g: { iron: 0.9, calcium: 10, vitaminB12: 2.5, vitaminD: 30, zinc: 0.7 }},

  { id: 'tuna_canned_oil', name: 'Tuna (canned in oil, drained)', nameHindi: '',
    caloriesPer100g: 198, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 8.2,
    isVeg: false, servingUnit: 'g', servingGrams: 85,
    microsPer100g: { iron: 1.3, calcium: 11, vitaminB12: 3, vitaminD: 36, zinc: 0.9 }},

  { id: 'salmon_fillet', name: 'Salmon Fillet (cooked)', nameHindi: '',
    caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.8, calcium: 13, vitaminB12: 3.2, vitaminD: 570, zinc: 0.6 }},

  { id: 'tilapia', name: 'Tilapia (cooked)', nameHindi: '',
    caloriesPer100g: 128, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 2.7,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.6, calcium: 14, vitaminB12: 1.6, vitaminD: 0, zinc: 0.4 }},

  { id: 'cod_fillet', name: 'Cod Fillet (cooked)', nameHindi: '',
    caloriesPer100g: 105, proteinPer100g: 23, carbsPer100g: 0, fatPer100g: 0.9,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.4, calcium: 14, vitaminB12: 0.9, vitaminD: 45, zinc: 0.5 }},

  { id: 'shrimp_cooked', name: 'Shrimp (cooked)', nameHindi: 'झींगा',
    caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3,
    isVeg: false, servingUnit: 'g', servingGrams: 85,
    microsPer100g: { iron: 0.3, calcium: 70, vitaminB12: 1.4, vitaminD: 0, zinc: 1.6 }},

  { id: 'tuna_steak', name: 'Tuna Steak (cooked)', nameHindi: '',
    caloriesPer100g: 144, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1.9,
    isVeg: false, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 1.2, calcium: 9, vitaminB12: 9.4, vitaminD: 227, zinc: 0.8 }},

  { id: 'mackerel', name: 'Mackerel (cooked)', nameHindi: '',
    caloriesPer100g: 262, proteinPer100g: 24, carbsPer100g: 0, fatPer100g: 18,
    isVeg: false, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 1.3, calcium: 13, vitaminB12: 16, vitaminD: 400, zinc: 0.8 }},

  // ── Dairy & dairy alternatives ────────────────────────
  { id: 'cottage_cheese_low', name: 'Cottage Cheese (low fat)', nameHindi: '',
    caloriesPer100g: 72, proteinPer100g: 12.4, carbsPer100g: 2.7, fatPer100g: 1,
    isVeg: true, servingUnit: 'cup', servingGrams: 226,
    microsPer100g: { iron: 0.1, calcium: 83, vitaminB12: 0.5, vitaminD: 0, zinc: 0.5 }},

  { id: 'cottage_cheese_full', name: 'Cottage Cheese (full fat)', nameHindi: '',
    caloriesPer100g: 98, proteinPer100g: 11.1, carbsPer100g: 3.4, fatPer100g: 4.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 226,
    microsPer100g: { iron: 0.1, calcium: 83, vitaminB12: 0.5, vitaminD: 0, zinc: 0.5 }},

  { id: 'skim_milk', name: 'Skim Milk', nameHindi: '',
    caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 244,
    microsPer100g: { iron: 0, calcium: 125, vitaminB12: 0.5, vitaminD: 40, zinc: 0.4 }},

  { id: 'whole_milk', name: 'Whole Milk', nameHindi: 'पूरा दूध',
    caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 244,
    microsPer100g: { iron: 0, calcium: 113, vitaminB12: 0.5, vitaminD: 40, zinc: 0.4 }},

  { id: 'cheddar_cheese', name: 'Cheddar Cheese', nameHindi: '',
    caloriesPer100g: 403, proteinPer100g: 24.9, carbsPer100g: 1.3, fatPer100g: 33,
    isVeg: true, servingUnit: 'slice', servingGrams: 28,
    microsPer100g: { iron: 0.2, calcium: 721, vitaminB12: 0.8, vitaminD: 24, zinc: 3.1 }},

  { id: 'mozzarella', name: 'Mozzarella Cheese', nameHindi: '',
    caloriesPer100g: 280, proteinPer100g: 19.9, carbsPer100g: 2.2, fatPer100g: 22,
    isVeg: true, servingUnit: 'slice', servingGrams: 28,
    microsPer100g: { iron: 0.1, calcium: 505, vitaminB12: 0.7, vitaminD: 0, zinc: 2.9 }},

  { id: 'parmesan', name: 'Parmesan Cheese (grated)', nameHindi: '',
    caloriesPer100g: 431, proteinPer100g: 38, carbsPer100g: 4, fatPer100g: 29,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 5,
    microsPer100g: { iron: 0.5, calcium: 1184, vitaminB12: 0.8, vitaminD: 0, zinc: 2.8 }},

  { id: 'cream_cheese', name: 'Cream Cheese', nameHindi: '',
    caloriesPer100g: 342, proteinPer100g: 6, carbsPer100g: 4.1, fatPer100g: 34,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 14,
    microsPer100g: { iron: 0.1, calcium: 80, vitaminB12: 0.2, vitaminD: 0, zinc: 0.5 }},

  { id: 'ricotta', name: 'Ricotta Cheese (whole milk)', nameHindi: '',
    caloriesPer100g: 174, proteinPer100g: 11.3, carbsPer100g: 3, fatPer100g: 13,
    isVeg: true, servingUnit: 'cup', servingGrams: 124,
    microsPer100g: { iron: 0.2, calcium: 207, vitaminB12: 0.3, vitaminD: 0, zinc: 1.7 }},

  { id: 'oat_milk', name: 'Oat Milk (unsweetened)', nameHindi: '',
    caloriesPer100g: 40, proteinPer100g: 1, carbsPer100g: 6.7, fatPer100g: 1.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.2, calcium: 120, vitaminB12: 0, vitaminD: 60, zinc: 0.1 }},

  { id: 'almond_milk', name: 'Almond Milk (unsweetened)', nameHindi: '',
    caloriesPer100g: 13, proteinPer100g: 0.5, carbsPer100g: 0.6, fatPer100g: 1.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.2, calcium: 187, vitaminB12: 0, vitaminD: 100, zinc: 0.1 }},

  // ── Global grains & carbs ────────────────────────────
  { id: 'white_bread', name: 'White Bread (slice)', nameHindi: '',
    caloriesPer100g: 266, proteinPer100g: 9, carbsPer100g: 51, fatPer100g: 3.3,
    isVeg: true, servingUnit: 'slice', servingGrams: 28,
    microsPer100g: { iron: 2.9, calcium: 100, vitaminB12: 0, vitaminD: 0, zinc: 0.8 }},

  { id: 'whole_wheat_bread', name: 'Whole Wheat Bread (slice)', nameHindi: '',
    caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 43, fatPer100g: 3.5,
    isVeg: true, servingUnit: 'slice', servingGrams: 28,
    microsPer100g: { iron: 2.5, calcium: 73, vitaminB12: 0, vitaminD: 0, zinc: 1.5 }},

  { id: 'pasta_cooked', name: 'Pasta (cooked, plain)', nameHindi: '',
    caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 140,
    microsPer100g: { iron: 1.3, calcium: 7, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'whole_wheat_pasta', name: 'Whole Wheat Pasta (cooked)', nameHindi: '',
    caloriesPer100g: 124, proteinPer100g: 5.3, carbsPer100g: 26, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 140,
    microsPer100g: { iron: 1.4, calcium: 21, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'quinoa_cooked', name: 'Quinoa (cooked)', nameHindi: '',
    caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21.3, fatPer100g: 1.9,
    isVeg: true, servingUnit: 'cup', servingGrams: 185,
    microsPer100g: { iron: 1.5, calcium: 17, vitaminB12: 0, vitaminD: 0, zinc: 1.1 }},

  { id: 'sweet_potato_baked', name: 'Sweet Potato (baked)', nameHindi: 'शकरकंद',
    caloriesPer100g: 90, proteinPer100g: 2, carbsPer100g: 20.7, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.7, calcium: 38, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'potato_baked', name: 'White Potato (baked)', nameHindi: 'आलू',
    caloriesPer100g: 93, proteinPer100g: 2.5, carbsPer100g: 21, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.6, calcium: 12, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'corn_tortilla', name: 'Corn Tortilla', nameHindi: '',
    caloriesPer100g: 218, proteinPer100g: 5.7, carbsPer100g: 45, fatPer100g: 2.7,
    isVeg: true, servingUnit: 'piece', servingGrams: 26,
    microsPer100g: { iron: 1.1, calcium: 46, vitaminB12: 0, vitaminD: 0, zinc: 0.7 }},

  { id: 'flour_tortilla', name: 'Flour Tortilla', nameHindi: '',
    caloriesPer100g: 307, proteinPer100g: 8, carbsPer100g: 52, fatPer100g: 7.3,
    isVeg: true, servingUnit: 'piece', servingGrams: 45,
    microsPer100g: { iron: 2.5, calcium: 87, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'bagel_plain', name: 'Bagel (plain)', nameHindi: '',
    caloriesPer100g: 257, proteinPer100g: 10, carbsPer100g: 50, fatPer100g: 1.6,
    isVeg: true, servingUnit: 'piece', servingGrams: 98,
    microsPer100g: { iron: 3.2, calcium: 53, vitaminB12: 0, vitaminD: 0, zinc: 0.9 }},

  { id: 'couscous_cooked', name: 'Couscous (cooked)', nameHindi: '',
    caloriesPer100g: 112, proteinPer100g: 3.8, carbsPer100g: 23, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 157,
    microsPer100g: { iron: 0.4, calcium: 8, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  // ── Vegetables ───────────────────────────────────────
  { id: 'broccoli', name: 'Broccoli (raw)', nameHindi: 'ब्रोकली',
    caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 6.6, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 91,
    microsPer100g: { iron: 0.7, calcium: 47, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'spinach_raw', name: 'Spinach (raw)', nameHindi: 'पालक',
    caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 30,
    microsPer100g: { iron: 2.7, calcium: 99, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'kale', name: 'Kale (raw)', nameHindi: '',
    caloriesPer100g: 49, proteinPer100g: 4.3, carbsPer100g: 9, fatPer100g: 0.9,
    isVeg: true, servingUnit: 'cup', servingGrams: 67,
    microsPer100g: { iron: 1.5, calcium: 150, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'lettuce_romaine', name: 'Romaine Lettuce', nameHindi: '',
    caloriesPer100g: 17, proteinPer100g: 1.2, carbsPer100g: 3.3, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 47,
    microsPer100g: { iron: 0.5, calcium: 18, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'cherry_tomatoes', name: 'Cherry Tomatoes', nameHindi: 'टमाटर',
    caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 149,
    microsPer100g: { iron: 0.3, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'cucumber', name: 'Cucumber (raw)', nameHindi: 'खीरा',
    caloriesPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 119,
    microsPer100g: { iron: 0.3, calcium: 16, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'bell_pepper_red', name: 'Red Bell Pepper', nameHindi: 'लाल शिमला मिर्च',
    caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'g', servingGrams: 120,
    microsPer100g: { iron: 0.4, calcium: 7, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'carrots', name: 'Carrots (raw)', nameHindi: 'गाजर',
    caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 9.6, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 0.3, calcium: 33, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'mushrooms_white', name: 'White Mushrooms (raw)', nameHindi: 'मशरूम',
    caloriesPer100g: 22, proteinPer100g: 3.1, carbsPer100g: 3.3, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 96,
    microsPer100g: { iron: 0.5, calcium: 3, vitaminB12: 0, vitaminD: 7, zinc: 0.5 }},

  { id: 'avocado', name: 'Avocado', nameHindi: 'एवोकाडो',
    caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 8.5, fatPer100g: 14.7,
    isVeg: true, servingUnit: 'g', servingGrams: 150,
    microsPer100g: { iron: 0.6, calcium: 12, vitaminB12: 0, vitaminD: 0, zinc: 0.6 }},

  { id: 'asparagus', name: 'Asparagus (cooked)', nameHindi: '',
    caloriesPer100g: 22, proteinPer100g: 2.4, carbsPer100g: 4.1, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'g', servingGrams: 90,
    microsPer100g: { iron: 2.1, calcium: 21, vitaminB12: 0, vitaminD: 0, zinc: 0.5 }},

  { id: 'edamame', name: 'Edamame (shelled, cooked)', nameHindi: '',
    caloriesPer100g: 122, proteinPer100g: 11.9, carbsPer100g: 8.9, fatPer100g: 5.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 155,
    microsPer100g: { iron: 2.3, calcium: 60, vitaminB12: 0, vitaminD: 0, zinc: 1.4 }},

  { id: 'cauliflower', name: 'Cauliflower (raw)', nameHindi: 'फूलगोभी',
    caloriesPer100g: 25, proteinPer100g: 1.9, carbsPer100g: 5, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 100,
    microsPer100g: { iron: 0.4, calcium: 22, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'green_beans', name: 'Green Beans (cooked)', nameHindi: 'फलियाँ',
    caloriesPer100g: 35, proteinPer100g: 1.9, carbsPer100g: 7.9, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 125,
    microsPer100g: { iron: 1, calcium: 55, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'zucchini', name: 'Zucchini (cooked)', nameHindi: '',
    caloriesPer100g: 17, proteinPer100g: 1.4, carbsPer100g: 3.5, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'g', servingGrams: 100,
    microsPer100g: { iron: 0.4, calcium: 20, vitaminB12: 0, vitaminD: 0, zinc: 0.3 }},

  { id: 'celery', name: 'Celery (raw)', nameHindi: '',
    caloriesPer100g: 16, proteinPer100g: 0.7, carbsPer100g: 3, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'g', servingGrams: 40,
    microsPer100g: { iron: 0.2, calcium: 40, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'black_beans_cooked', name: 'Black Beans (cooked)', nameHindi: '',
    caloriesPer100g: 132, proteinPer100g: 8.9, carbsPer100g: 24, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 172,
    microsPer100g: { iron: 2.1, calcium: 27, vitaminB12: 0, vitaminD: 0, zinc: 1 }},

  { id: 'lentils_cooked', name: 'Green Lentils (cooked)', nameHindi: 'मसूर',
    caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4,
    isVeg: true, servingUnit: 'cup', servingGrams: 198,
    microsPer100g: { iron: 3.3, calcium: 19, vitaminB12: 0, vitaminD: 0, zinc: 1.3 }},

  // ── Fruits ───────────────────────────────────────────
  { id: 'strawberries', name: 'Strawberries', nameHindi: 'स्ट्रॉबेरी',
    caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 152,
    microsPer100g: { iron: 0.4, calcium: 16, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'blueberries', name: 'Blueberries', nameHindi: 'ब्लूबेरी',
    caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14.5, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'cup', servingGrams: 148,
    microsPer100g: { iron: 0.3, calcium: 6, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'raspberries', name: 'Raspberries', nameHindi: '',
    caloriesPer100g: 52, proteinPer100g: 1.2, carbsPer100g: 11.9, fatPer100g: 0.7,
    isVeg: true, servingUnit: 'cup', servingGrams: 123,
    microsPer100g: { iron: 0.7, calcium: 25, vitaminB12: 0, vitaminD: 0, zinc: 0.4 }},

  { id: 'orange', name: 'Orange', nameHindi: 'संतरा',
    caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 11.8, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'piece', servingGrams: 131,
    microsPer100g: { iron: 0.1, calcium: 40, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'grapes', name: 'Grapes (red/green)', nameHindi: 'अंगूर',
    caloriesPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 151,
    microsPer100g: { iron: 0.4, calcium: 10, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'watermelon', name: 'Watermelon', nameHindi: 'तरबूज',
    caloriesPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 7.6, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 280,
    microsPer100g: { iron: 0.2, calcium: 7, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'pineapple', name: 'Pineapple (fresh)', nameHindi: 'अनानास',
    caloriesPer100g: 50, proteinPer100g: 0.5, carbsPer100g: 13.1, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 165,
    microsPer100g: { iron: 0.3, calcium: 13, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'peach', name: 'Peach', nameHindi: 'आड़ू',
    caloriesPer100g: 39, proteinPer100g: 0.9, carbsPer100g: 9.5, fatPer100g: 0.3,
    isVeg: true, servingUnit: 'piece', servingGrams: 150,
    microsPer100g: { iron: 0.3, calcium: 6, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'kiwi', name: 'Kiwi Fruit', nameHindi: 'कीवी',
    caloriesPer100g: 61, proteinPer100g: 1.1, carbsPer100g: 14.7, fatPer100g: 0.5,
    isVeg: true, servingUnit: 'piece', servingGrams: 75,
    microsPer100g: { iron: 0.3, calcium: 34, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'pear', name: 'Pear', nameHindi: 'नाशपाती',
    caloriesPer100g: 57, proteinPer100g: 0.4, carbsPer100g: 15.2, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'piece', servingGrams: 178,
    microsPer100g: { iron: 0.2, calcium: 9, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'cherries', name: 'Cherries', nameHindi: 'चेरी',
    caloriesPer100g: 63, proteinPer100g: 1.1, carbsPer100g: 16, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 154,
    microsPer100g: { iron: 0.4, calcium: 13, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  // ── Nuts, seeds & nut butters ────────────────────────
  { id: 'almonds', name: 'Almonds (raw)', nameHindi: 'बादाम',
    caloriesPer100g: 579, proteinPer100g: 21.2, carbsPer100g: 21.6, fatPer100g: 49.9,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 3.7, calcium: 264, vitaminB12: 0, vitaminD: 0, zinc: 3.1 }},

  { id: 'walnuts', name: 'Walnuts', nameHindi: 'अखरोट',
    caloriesPer100g: 654, proteinPer100g: 15.2, carbsPer100g: 13.7, fatPer100g: 65.2,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 2.9, calcium: 98, vitaminB12: 0, vitaminD: 0, zinc: 3.1 }},

  { id: 'cashews', name: 'Cashews (raw)', nameHindi: 'काजू',
    caloriesPer100g: 553, proteinPer100g: 18.2, carbsPer100g: 30.2, fatPer100g: 43.8,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 6.7, calcium: 37, vitaminB12: 0, vitaminD: 0, zinc: 5.8 }},

  { id: 'peanuts_roasted', name: 'Peanuts (dry roasted)', nameHindi: 'मूंगफली',
    caloriesPer100g: 585, proteinPer100g: 23.7, carbsPer100g: 21.5, fatPer100g: 49.7,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 1.6, calcium: 54, vitaminB12: 0, vitaminD: 0, zinc: 3.3 }},

  { id: 'peanut_butter', name: 'Peanut Butter (natural)', nameHindi: 'पीनट बटर',
    caloriesPer100g: 588, proteinPer100g: 25.1, carbsPer100g: 20, fatPer100g: 50,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 16,
    microsPer100g: { iron: 1.9, calcium: 49, vitaminB12: 0, vitaminD: 0, zinc: 2.9 }},

  { id: 'almond_butter', name: 'Almond Butter', nameHindi: '',
    caloriesPer100g: 614, proteinPer100g: 20.7, carbsPer100g: 18.8, fatPer100g: 55.5,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 16,
    microsPer100g: { iron: 3.5, calcium: 347, vitaminB12: 0, vitaminD: 0, zinc: 3 }},

  { id: 'chia_seeds', name: 'Chia Seeds', nameHindi: 'चिया बीज',
    caloriesPer100g: 486, proteinPer100g: 16.5, carbsPer100g: 42.1, fatPer100g: 30.7,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 10,
    microsPer100g: { iron: 7.7, calcium: 631, vitaminB12: 0, vitaminD: 0, zinc: 4.6 }},

  { id: 'flaxseeds', name: 'Flaxseeds (ground)', nameHindi: 'अलसी',
    caloriesPer100g: 534, proteinPer100g: 18.3, carbsPer100g: 28.9, fatPer100g: 42.2,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 7,
    microsPer100g: { iron: 5.7, calcium: 255, vitaminB12: 0, vitaminD: 0, zinc: 4.3 }},

  { id: 'pumpkin_seeds', name: 'Pumpkin Seeds', nameHindi: 'कद्दू के बीज',
    caloriesPer100g: 559, proteinPer100g: 30.2, carbsPer100g: 10.7, fatPer100g: 49,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 8.8, calcium: 46, vitaminB12: 0, vitaminD: 0, zinc: 7.8 }},

  { id: 'pistachios', name: 'Pistachios', nameHindi: 'पिस्ता',
    caloriesPer100g: 562, proteinPer100g: 20.3, carbsPer100g: 27.5, fatPer100g: 45.4,
    isVeg: true, servingUnit: 'g', servingGrams: 28,
    microsPer100g: { iron: 4, calcium: 105, vitaminB12: 0, vitaminD: 0, zinc: 2.2 }},

  // ── Protein supplements ──────────────────────────────
  { id: 'whey_protein_water', name: 'Whey Protein Shake (with water)', nameHindi: '',
    caloriesPer100g: 100, proteinPer100g: 20, carbsPer100g: 3, fatPer100g: 1.5,
    isVeg: false, servingUnit: 'scoop', servingGrams: 30,
    microsPer100g: { iron: 0.3, calcium: 120, vitaminB12: 0.3, vitaminD: 0, zinc: 0.5 }},

  { id: 'plant_protein', name: 'Plant Protein Powder (pea/rice)', nameHindi: '',
    caloriesPer100g: 363, proteinPer100g: 72, carbsPer100g: 6, fatPer100g: 7,
    isVeg: true, servingUnit: 'scoop', servingGrams: 33,
    microsPer100g: { iron: 7, calcium: 100, vitaminB12: 0, vitaminD: 0, zinc: 2.5 }},

  { id: 'casein_protein', name: 'Casein Protein Powder', nameHindi: '',
    caloriesPer100g: 357, proteinPer100g: 75, carbsPer100g: 5, fatPer100g: 4,
    isVeg: false, servingUnit: 'scoop', servingGrams: 32,
    microsPer100g: { iron: 0.5, calcium: 400, vitaminB12: 0.5, vitaminD: 0, zinc: 1.5 }},

  // ── Snacks & packaged ────────────────────────────────
  { id: 'rice_cake_plain', name: 'Rice Cake (plain)', nameHindi: '',
    caloriesPer100g: 387, proteinPer100g: 7.3, carbsPer100g: 81.5, fatPer100g: 2.8,
    isVeg: true, servingUnit: 'piece', servingGrams: 9,
    microsPer100g: { iron: 0.7, calcium: 5, vitaminB12: 0, vitaminD: 0, zinc: 0.7 }},

  { id: 'popcorn_plain', name: 'Popcorn (air-popped)', nameHindi: '',
    caloriesPer100g: 387, proteinPer100g: 12.9, carbsPer100g: 77.8, fatPer100g: 4.5,
    isVeg: true, servingUnit: 'cup', servingGrams: 8,
    microsPer100g: { iron: 2.7, calcium: 3, vitaminB12: 0, vitaminD: 0, zinc: 0.9 }},

  { id: 'dark_chocolate', name: 'Dark Chocolate (70–85%)', nameHindi: 'डार्क चॉकलेट',
    caloriesPer100g: 598, proteinPer100g: 7.8, carbsPer100g: 45.9, fatPer100g: 42.6,
    isVeg: true, servingUnit: 'g', servingGrams: 30,
    microsPer100g: { iron: 11.9, calcium: 73, vitaminB12: 0, vitaminD: 0, zinc: 3.3 }},

  { id: 'granola', name: 'Granola (plain)', nameHindi: '',
    caloriesPer100g: 471, proteinPer100g: 10.3, carbsPer100g: 64.2, fatPer100g: 20.1,
    isVeg: true, servingUnit: 'cup', servingGrams: 117,
    microsPer100g: { iron: 3.6, calcium: 52, vitaminB12: 0, vitaminD: 0, zinc: 2.6 }},

  { id: 'protein_bar', name: 'Protein Bar (avg 20g protein)', nameHindi: '',
    caloriesPer100g: 376, proteinPer100g: 32.3, carbsPer100g: 35.5, fatPer100g: 12.9,
    isVeg: false, servingUnit: 'piece', servingGrams: 62,
    microsPer100g: { iron: 3, calcium: 250, vitaminB12: 0.5, vitaminD: 0, zinc: 2 }},

  // ── Condiments & cooking basics ───────────────────────
  { id: 'olive_oil', name: 'Olive Oil', nameHindi: 'जैतून का तेल',
    caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 14,
    microsPer100g: { iron: 0.1, calcium: 1, vitaminB12: 0, vitaminD: 0, zinc: 0 }},

  { id: 'mayonnaise', name: 'Mayonnaise (regular)', nameHindi: 'मेयोनेज़',
    caloriesPer100g: 680, proteinPer100g: 1, carbsPer100g: 0.6, fatPer100g: 74,
    isVeg: false, servingUnit: 'tbsp', servingGrams: 14,
    microsPer100g: { iron: 0.1, calcium: 7, vitaminB12: 0.1, vitaminD: 0, zinc: 0.1 }},

  { id: 'ketchup', name: 'Tomato Ketchup', nameHindi: 'केचप',
    caloriesPer100g: 112, proteinPer100g: 1.3, carbsPer100g: 26.8, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 17,
    microsPer100g: { iron: 0.5, calcium: 12, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'soy_sauce', name: 'Soy Sauce (regular)', nameHindi: 'सोया सॉस',
    caloriesPer100g: 53, proteinPer100g: 8.1, carbsPer100g: 4.9, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 16,
    microsPer100g: { iron: 1.5, calcium: 17, vitaminB12: 0, vitaminD: 0, zinc: 0.2 }},

  { id: 'maple_syrup', name: 'Maple Syrup', nameHindi: '',
    caloriesPer100g: 260, proteinPer100g: 0, carbsPer100g: 67, fatPer100g: 0.1,
    isVeg: true, servingUnit: 'tbsp', servingGrams: 20,
    microsPer100g: { iron: 0.1, calcium: 102, vitaminB12: 0, vitaminD: 0, zinc: 1.4 }},

  // ── Beverages ────────────────────────────────────────
  { id: 'orange_juice', name: 'Orange Juice (fresh)', nameHindi: 'संतरे का रस',
    caloriesPer100g: 45, proteinPer100g: 0.7, carbsPer100g: 10.4, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 248,
    microsPer100g: { iron: 0.2, calcium: 11, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'coconut_water', name: 'Coconut Water', nameHindi: 'नारियल पानी',
    caloriesPer100g: 19, proteinPer100g: 0.7, carbsPer100g: 3.7, fatPer100g: 0.2,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0.3, calcium: 24, vitaminB12: 0, vitaminD: 0, zinc: 0.1 }},

  { id: 'green_tea', name: 'Green Tea (brewed)', nameHindi: 'हरी चाय',
    caloriesPer100g: 1, proteinPer100g: 0.2, carbsPer100g: 0.2, fatPer100g: 0,
    isVeg: true, servingUnit: 'cup', servingGrams: 240,
    microsPer100g: { iron: 0, calcium: 2, vitaminB12: 0, vitaminD: 0, zinc: 0 }},
];

function getFoodById(id: string): FoodItem | undefined {
  return FOODS.find(f => f.id === id);
}
