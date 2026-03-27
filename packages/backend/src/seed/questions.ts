import { getDb } from '../db/index';
import { v4 as uuidv4 } from 'uuid';
import { ASSESSMENT_IDS } from './assessments';

interface QuestionSpec {
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const questionsByAssessment: Record<string, QuestionSpec[]> = {

  // ─────────────────────────────────────────────
  // NUMBER TOWER — EASY (basic arithmetic, single-step)
  // ─────────────────────────────────────────────
  number_tower_easy: [
    {
      text: 'What is 347 + 256?',
      options: ['603', '593', '613', '583'],
      correctIndex: 0,
      explanation: '347 + 256: 300+200=500, 40+50=90, 7+6=13. Total: 603.',
      difficulty: 'easy',
    },
    {
      text: 'What is 812 − 375?',
      options: ['437', '447', '427', '467'],
      correctIndex: 0,
      explanation: '812 − 375: borrow as needed. 812 − 375 = 437.',
      difficulty: 'easy',
    },
    {
      text: 'What is 24 × 6?',
      options: ['144', '134', '154', '124'],
      correctIndex: 0,
      explanation: '24 × 6: 20×6=120, 4×6=24. Total: 144.',
      difficulty: 'easy',
    },
    {
      text: 'What is 108 ÷ 9?',
      options: ['12', '13', '11', '14'],
      correctIndex: 0,
      explanation: '9 × 12 = 108, so 108 ÷ 9 = 12.',
      difficulty: 'easy',
    },
    {
      text: 'What is 56 × 7?',
      options: ['392', '382', '402', '372'],
      correctIndex: 0,
      explanation: '56 × 7: 50×7=350, 6×7=42. Total: 392.',
      difficulty: 'easy',
    },
    {
      text: 'What is 315 + 487?',
      options: ['802', '812', '792', '822'],
      correctIndex: 0,
      explanation: '315 + 487: 300+400=700, 15+87=102. Total: 802.',
      difficulty: 'easy',
    },
    {
      text: 'What is 900 − 364?',
      options: ['536', '526', '546', '556'],
      correctIndex: 0,
      explanation: '900 − 364 = 536.',
      difficulty: 'easy',
    },
    {
      text: 'What is 144 ÷ 12?',
      options: ['12', '11', '13', '14'],
      correctIndex: 0,
      explanation: '12 × 12 = 144, so 144 ÷ 12 = 12.',
      difficulty: 'easy',
    },
    {
      text: 'What is 63 × 4?',
      options: ['252', '242', '262', '232'],
      correctIndex: 0,
      explanation: '63 × 4: 60×4=240, 3×4=12. Total: 252.',
      difficulty: 'easy',
    },
    {
      text: 'What is 1,000 − 437?',
      options: ['563', '573', '553', '583'],
      correctIndex: 0,
      explanation: '1000 − 437 = 563.',
      difficulty: 'easy',
    },
  ],

  // ─────────────────────────────────────────────
  // NUMBER TOWER — MEDIUM (multi-step arithmetic)
  // ─────────────────────────────────────────────
  number_tower_medium: [
    {
      text: 'What is 247 × 8?',
      options: ['1,976', '1,896', '2,076', '1,956'],
      correctIndex: 0,
      explanation: '247 × 8: 200×8=1600, 40×8=320, 7×8=56. Total: 1,976.',
      difficulty: 'medium',
    },
    {
      text: 'What is 1,248 ÷ 24?',
      options: ['52', '48', '56', '44'],
      correctIndex: 0,
      explanation: '24 × 52 = 1,248. Check: 24×50=1200, 24×2=48. Total: 1,248.',
      difficulty: 'medium',
    },
    {
      text: 'What is 3,456 + 1,789?',
      options: ['5,245', '5,145', '5,345', '5,045'],
      correctIndex: 0,
      explanation: '3,456 + 1,789: 3000+1000=4000, 456+789=1245. Total: 5,245.',
      difficulty: 'medium',
    },
    {
      text: 'What is 4,003 − 1,567?',
      options: ['2,436', '2,536', '2,336', '2,446'],
      correctIndex: 0,
      explanation: '4,003 − 1,567 = 2,436.',
      difficulty: 'medium',
    },
    {
      text: 'A shopkeeper has 1,456 apples. He sells 378 on Monday and 293 on Tuesday. How many are left?',
      options: ['785', '795', '775', '805'],
      correctIndex: 0,
      explanation: '378 + 293 = 671 sold. 1,456 − 671 = 785 remaining.',
      difficulty: 'medium',
    },
    {
      text: 'What is 125 × 16?',
      options: ['2,000', '1,900', '2,100', '1,800'],
      correctIndex: 0,
      explanation: '125 × 16: 125 × 8 = 1000, then ×2 = 2,000.',
      difficulty: 'medium',
    },
    {
      text: 'What is 3,600 ÷ 45?',
      options: ['80', '75', '90', '70'],
      correctIndex: 0,
      explanation: '45 × 80 = 3,600. Check: 45×80 = 45×8×10 = 360×10 = 3,600.',
      difficulty: 'medium',
    },
    {
      text: 'What is (43 + 57) × 12?',
      options: ['1,200', '1,100', '1,300', '1,000'],
      correctIndex: 0,
      explanation: '43 + 57 = 100. 100 × 12 = 1,200.',
      difficulty: 'medium',
    },
    {
      text: 'What is 756 × 9?',
      options: ['6,804', '6,704', '6,904', '6,604'],
      correctIndex: 0,
      explanation: '756 × 9: 700×9=6300, 56×9=504. Total: 6,804.',
      difficulty: 'medium',
    },
    {
      text: 'A train travels 468 km on Monday, 512 km on Tuesday, and 389 km on Wednesday. What is the total distance?',
      options: ['1,369 km', '1,279 km', '1,469 km', '1,359 km'],
      correctIndex: 0,
      explanation: '468 + 512 = 980. 980 + 389 = 1,369 km.',
      difficulty: 'medium',
    },
  ],

  // ─────────────────────────────────────────────
  // NUMBER TOWER — HARD (complex arithmetic, mixed ops)
  // ─────────────────────────────────────────────
  number_tower_hard: [
    {
      text: 'What is 2,345 × 23?',
      options: ['53,935', '52,935', '54,935', '51,935'],
      correctIndex: 0,
      explanation: '2,345 × 20 = 46,900. 2,345 × 3 = 7,035. Total: 53,935.',
      difficulty: 'hard',
    },
    {
      text: 'What is 13,872 ÷ 48?',
      options: ['289', '279', '299', '269'],
      correctIndex: 0,
      explanation: '48 × 289 = 48 × 300 − 48 × 11 = 14,400 − 528 = 13,872.',
      difficulty: 'hard',
    },
    {
      text: 'A factory produces 1,248 items per day. How many items in 3 weeks (21 days)?',
      options: ['26,208', '25,208', '27,208', '24,208'],
      correctIndex: 0,
      explanation: '1,248 × 21: 1,248 × 20 = 24,960. 1,248 × 1 = 1,248. Total: 26,208.',
      difficulty: 'hard',
    },
    {
      text: 'What is 15² − 8²?',
      options: ['161', '151', '171', '141'],
      correctIndex: 0,
      explanation: '15² = 225. 8² = 64. 225 − 64 = 161.',
      difficulty: 'hard',
    },
    {
      text: 'What is 456 × 34 + 789?',
      options: ['16,293', '15,293', '17,293', '15,793'],
      correctIndex: 0,
      explanation: '456 × 34: 456×30=13,680, 456×4=1,824. Sum=15,504. +789=16,293.',
      difficulty: 'hard',
    },
    {
      text: 'What is the value of 4,900 ÷ 70 × 8?',
      options: ['560', '480', '640', '420'],
      correctIndex: 0,
      explanation: '4,900 ÷ 70 = 70. 70 × 8 = 560.',
      difficulty: 'hard',
    },
    {
      text: 'If 37 × 48 = 1,776, what is 37 × 4.8?',
      options: ['177.6', '1,776', '17.76', '1,7.76'],
      correctIndex: 0,
      explanation: '4.8 is 48 ÷ 10, so 37 × 4.8 = 1,776 ÷ 10 = 177.6.',
      difficulty: 'hard',
    },
    {
      text: 'What is (100² − 99²)?',
      options: ['199', '201', '198', '200'],
      correctIndex: 0,
      explanation: 'Difference of squares: (100+99)(100−99) = 199 × 1 = 199.',
      difficulty: 'hard',
    },
    {
      text: 'A number is multiplied by 7, then 145 is added and the result is 964. What is the original number?',
      options: ['117', '127', '107', '137'],
      correctIndex: 0,
      explanation: '964 − 145 = 819. 819 ÷ 7 = 117.',
      difficulty: 'hard',
    },
    {
      text: 'What is 999 × 999?',
      options: ['998,001', '997,001', '999,001', '996,001'],
      correctIndex: 0,
      explanation: '999² = (1000−1)² = 1,000,000 − 2,000 + 1 = 998,001.',
      difficulty: 'hard',
    },
  ],

  // ─────────────────────────────────────────────
  // FRACTION FALLS — EASY (halves, quarters, thirds)
  // ─────────────────────────────────────────────
  fraction_falls_easy: [
    {
      text: 'What fraction of 60 is 45?',
      options: ['3/4', '2/3', '5/6', '4/5'],
      correctIndex: 0,
      explanation: '45/60 = 3/4. Both divide by 15: 45÷15=3, 60÷15=4.',
      difficulty: 'easy',
    },
    {
      text: 'What is 1/4 of 84?',
      options: ['21', '24', '18', '28'],
      correctIndex: 0,
      explanation: '84 ÷ 4 = 21.',
      difficulty: 'easy',
    },
    {
      text: 'What is 2/3 of 90?',
      options: ['60', '45', '30', '75'],
      correctIndex: 0,
      explanation: '90 ÷ 3 = 30. 30 × 2 = 60.',
      difficulty: 'easy',
    },
    {
      text: 'Which fraction is equivalent to 6/8?',
      options: ['3/4', '2/3', '5/6', '4/5'],
      correctIndex: 0,
      explanation: '6/8 simplifies by dividing both by 2: 3/4.',
      difficulty: 'easy',
    },
    {
      text: 'What is 3/5 of 35?',
      options: ['21', '25', '18', '28'],
      correctIndex: 0,
      explanation: '35 ÷ 5 = 7. 7 × 3 = 21.',
      difficulty: 'easy',
    },
    {
      text: 'Which is larger: 3/4 or 2/3?',
      options: ['3/4', '2/3', 'They are equal', 'Cannot tell'],
      correctIndex: 0,
      explanation: '3/4 = 9/12 and 2/3 = 8/12, so 3/4 is larger.',
      difficulty: 'easy',
    },
    {
      text: 'A bag has 24 sweets. Tom eats 1/3 of them. How many are left?',
      options: ['16', '8', '12', '18'],
      correctIndex: 0,
      explanation: '1/3 of 24 = 8. 24 − 8 = 16 remaining.',
      difficulty: 'easy',
    },
    {
      text: 'What is 5/8 written as a decimal?',
      options: ['0.625', '0.58', '0.5', '0.65'],
      correctIndex: 0,
      explanation: '5 ÷ 8 = 0.625.',
      difficulty: 'easy',
    },
    {
      text: 'What is 1/2 + 1/4?',
      options: ['3/4', '1/2', '2/3', '1/3'],
      correctIndex: 0,
      explanation: '1/2 = 2/4. 2/4 + 1/4 = 3/4.',
      difficulty: 'easy',
    },
    {
      text: 'Which fraction is closest to 1?',
      options: ['7/8', '3/4', '4/5', '5/6'],
      correctIndex: 0,
      explanation: '7/8 = 0.875, 3/4 = 0.75, 4/5 = 0.8, 5/6 ≈ 0.833. So 7/8 is closest to 1.',
      difficulty: 'easy',
    },
  ],

  // ─────────────────────────────────────────────
  // FRACTION FALLS — MEDIUM (add/subtract unlike denominators)
  // ─────────────────────────────────────────────
  fraction_falls_medium: [
    {
      text: 'What is 3/4 + 5/6?',
      options: ['19/12', '8/10', '4/5', '17/12'],
      correctIndex: 0,
      explanation: 'LCM of 4 and 6 is 12. 3/4 = 9/12, 5/6 = 10/12. Sum = 19/12.',
      difficulty: 'medium',
    },
    {
      text: 'What is 7/8 − 1/3?',
      options: ['13/24', '6/5', '11/24', '5/12'],
      correctIndex: 0,
      explanation: 'LCM of 8 and 3 is 24. 7/8 = 21/24, 1/3 = 8/24. 21/24 − 8/24 = 13/24.',
      difficulty: 'medium',
    },
    {
      text: 'What is 2/3 × 9/10?',
      options: ['3/5', '11/13', '6/7', '18/30'],
      correctIndex: 0,
      explanation: '2/3 × 9/10 = 18/30 = 3/5 (simplify by dividing by 6).',
      difficulty: 'medium',
    },
    {
      text: 'What is 5/6 ÷ 5/3?',
      options: ['1/2', '5/9', '2/3', '25/18'],
      correctIndex: 0,
      explanation: '5/6 ÷ 5/3 = 5/6 × 3/5 = 15/30 = 1/2.',
      difficulty: 'medium',
    },
    {
      text: 'Sarah spends 2/5 of her money on food and 1/3 on transport. What fraction is left?',
      options: ['4/15', '2/8', '1/3', '3/10'],
      correctIndex: 0,
      explanation: '2/5 + 1/3 = 6/15 + 5/15 = 11/15. Left: 1 − 11/15 = 4/15.',
      difficulty: 'medium',
    },
    {
      text: 'What is 1 3/4 + 2 5/8?',
      options: ['4 3/8', '3 5/8', '4 1/2', '3 7/8'],
      correctIndex: 0,
      explanation: '1 3/4 = 1 6/8. 1 6/8 + 2 5/8 = 3 11/8 = 4 3/8.',
      difficulty: 'medium',
    },
    {
      text: 'A recipe needs 3/4 cup of flour. If you make 2½ batches, how much flour is needed?',
      options: ['1 7/8 cups', '2 cups', '1 3/4 cups', '2 1/4 cups'],
      correctIndex: 0,
      explanation: '3/4 × 5/2 = 15/8 = 1 7/8 cups.',
      difficulty: 'medium',
    },
    {
      text: 'What is 5/9 of 108?',
      options: ['60', '54', '65', '70'],
      correctIndex: 0,
      explanation: '108 ÷ 9 = 12. 12 × 5 = 60.',
      difficulty: 'medium',
    },
    {
      text: 'Arrange in ascending order: 5/6, 7/9, 4/5.',
      options: ['7/9, 4/5, 5/6', '5/6, 4/5, 7/9', '4/5, 7/9, 5/6', '7/9, 5/6, 4/5'],
      correctIndex: 0,
      explanation: '7/9 ≈ 0.778, 4/5 = 0.8, 5/6 ≈ 0.833. Ascending: 7/9 < 4/5 < 5/6.',
      difficulty: 'medium',
    },
    {
      text: 'What is 3/7 of 84?',
      options: ['36', '42', '30', '48'],
      correctIndex: 0,
      explanation: '84 ÷ 7 = 12. 12 × 3 = 36.',
      difficulty: 'medium',
    },
  ],

  // ─────────────────────────────────────────────
  // FRACTION FALLS — HARD (fractions, decimals, % combined)
  // ─────────────────────────────────────────────
  fraction_falls_hard: [
    {
      text: 'A jacket costs £120. It is reduced by 35%. What is the sale price?',
      options: ['£78', '£84', '£72', '£90'],
      correctIndex: 0,
      explanation: '35% of £120 = 0.35 × 120 = £42. Sale price: £120 − £42 = £78.',
      difficulty: 'hard',
    },
    {
      text: 'A number is increased by 20% to give 84. What was the original number?',
      options: ['70', '64', '72', '68'],
      correctIndex: 0,
      explanation: '120% = 84, so 1% = 0.7 and 100% = 70.',
      difficulty: 'hard',
    },
    {
      text: 'What is 0.375 expressed as a fraction in its simplest form?',
      options: ['3/8', '3/7', '4/9', '5/12'],
      correctIndex: 0,
      explanation: '0.375 = 375/1000. Divide by 125: 3/8.',
      difficulty: 'hard',
    },
    {
      text: 'A shop marks up a £60 cost price by 40% then offers 25% discount. What is the selling price?',
      options: ['£63', '£66', '£57', '£72'],
      correctIndex: 0,
      explanation: '£60 × 1.4 = £84. £84 × 0.75 = £63.',
      difficulty: 'hard',
    },
    {
      text: 'Express 7/16 as a percentage.',
      options: ['43.75%', '46.25%', '42.5%', '44.5%'],
      correctIndex: 0,
      explanation: '7 ÷ 16 = 0.4375. × 100 = 43.75%.',
      difficulty: 'hard',
    },
    {
      text: 'If 5/8 of a sum of money is £455, what is 3/4 of the same sum?',
      options: ['£546', '£504', '£560', '£520'],
      correctIndex: 0,
      explanation: '1/8 = £455 ÷ 5 = £91. Full sum = £728. 3/4 × £728 = £546.',
      difficulty: 'hard',
    },
    {
      text: 'A tank is 3/5 full. After adding 24 litres it is 4/5 full. What is the capacity of the tank?',
      options: ['120 litres', '100 litres', '80 litres', '144 litres'],
      correctIndex: 0,
      explanation: '4/5 − 3/5 = 1/5. 1/5 = 24 litres, so full = 24 × 5 = 120 litres.',
      difficulty: 'hard',
    },
    {
      text: 'What is 3.6 × 0.45?',
      options: ['1.62', '1.71', '1.53', '1.80'],
      correctIndex: 0,
      explanation: '3.6 × 0.45: 36 × 45 = 1,620. Adjust decimal: 1.620 = 1.62.',
      difficulty: 'hard',
    },
    {
      text: 'After a 15% pay rise, an employee earns £920 per week. What was their pay before the rise?',
      options: ['£800', '£782', '£812', '£820'],
      correctIndex: 0,
      explanation: '115% = £920, so 1% = £8, 100% = £800.',
      difficulty: 'hard',
    },
    {
      text: 'What fraction of 2½ hours is 45 minutes?',
      options: ['3/10', '1/4', '1/3', '2/5'],
      correctIndex: 0,
      explanation: '2½ hours = 150 minutes. 45/150 = 3/10.',
      difficulty: 'hard',
    },
  ],

  // ─────────────────────────────────────────────
  // SHAPE CITY — EASY (basic shapes, area/perimeter)
  // ─────────────────────────────────────────────
  shape_city_easy: [
    {
      text: 'A square has perimeter 36 cm. What is its area?',
      options: ['81 cm²', '72 cm²', '64 cm²', '100 cm²'],
      correctIndex: 0,
      explanation: 'Perimeter 36 ÷ 4 = 9 cm per side. Area = 9 × 9 = 81 cm².',
      difficulty: 'easy',
    },
    {
      text: 'A rectangle is 8 cm long and 5 cm wide. What is its perimeter?',
      options: ['26 cm', '40 cm', '13 cm', '24 cm'],
      correctIndex: 0,
      explanation: 'Perimeter = 2 × (8 + 5) = 2 × 13 = 26 cm.',
      difficulty: 'easy',
    },
    {
      text: 'A rectangle is 12 cm long and 7 cm wide. What is its area?',
      options: ['84 cm²', '38 cm²', '74 cm²', '94 cm²'],
      correctIndex: 0,
      explanation: 'Area = 12 × 7 = 84 cm².',
      difficulty: 'easy',
    },
    {
      text: 'How many lines of symmetry does a regular hexagon have?',
      options: ['6', '3', '4', '8'],
      correctIndex: 0,
      explanation: 'A regular hexagon has 6 lines of symmetry.',
      difficulty: 'easy',
    },
    {
      text: 'What is the area of a triangle with base 10 cm and height 6 cm?',
      options: ['30 cm²', '60 cm²', '25 cm²', '15 cm²'],
      correctIndex: 0,
      explanation: 'Area = ½ × base × height = ½ × 10 × 6 = 30 cm².',
      difficulty: 'easy',
    },
    {
      text: 'A room is 5 m by 4 m. How many 1 m² tiles are needed to cover the floor?',
      options: ['20', '18', '22', '16'],
      correctIndex: 0,
      explanation: 'Area = 5 × 4 = 20 m², so 20 tiles needed.',
      difficulty: 'easy',
    },
    {
      text: 'What type of angle is 135°?',
      options: ['Obtuse', 'Acute', 'Right', 'Reflex'],
      correctIndex: 0,
      explanation: 'An obtuse angle is between 90° and 180°. 135° is obtuse.',
      difficulty: 'easy',
    },
    {
      text: 'What is the perimeter of an equilateral triangle with side 9 cm?',
      options: ['27 cm', '18 cm', '36 cm', '81 cm'],
      correctIndex: 0,
      explanation: 'All 3 sides equal 9 cm. Perimeter = 3 × 9 = 27 cm.',
      difficulty: 'easy',
    },
    {
      text: 'A cube has edges of 4 cm. What is its volume?',
      options: ['64 cm³', '48 cm³', '16 cm³', '96 cm³'],
      correctIndex: 0,
      explanation: 'Volume = 4³ = 4 × 4 × 4 = 64 cm³.',
      difficulty: 'easy',
    },
    {
      text: 'What is the sum of angles in a triangle?',
      options: ['180°', '270°', '360°', '90°'],
      correctIndex: 0,
      explanation: 'The angles in any triangle always add up to 180°.',
      difficulty: 'easy',
    },
  ],

  // ─────────────────────────────────────────────
  // SHAPE CITY — MEDIUM (compound shapes, polygon angles)
  // ─────────────────────────────────────────────
  shape_city_medium: [
    {
      text: 'An L-shaped figure is made from a 10 × 8 rectangle with a 3 × 4 rectangle removed from one corner. What is its area?',
      options: ['68 cm²', '72 cm²', '62 cm²', '80 cm²'],
      correctIndex: 0,
      explanation: '10 × 8 = 80. Removed piece: 3 × 4 = 12. Area = 80 − 12 = 68 cm².',
      difficulty: 'medium',
    },
    {
      text: 'What is the sum of interior angles of a pentagon?',
      options: ['540°', '360°', '720°', '480°'],
      correctIndex: 0,
      explanation: 'Sum = (5 − 2) × 180° = 3 × 180° = 540°.',
      difficulty: 'medium',
    },
    {
      text: 'A parallelogram has base 14 cm and height 9 cm. What is its area?',
      options: ['126 cm²', '46 cm²', '108 cm²', '116 cm²'],
      correctIndex: 0,
      explanation: 'Area of parallelogram = base × height = 14 × 9 = 126 cm².',
      difficulty: 'medium',
    },
    {
      text: 'A trapezium has parallel sides 8 cm and 12 cm, and a height of 5 cm. What is its area?',
      options: ['50 cm²', '40 cm²', '60 cm²', '45 cm²'],
      correctIndex: 0,
      explanation: 'Area = ½ × (8 + 12) × 5 = ½ × 20 × 5 = 50 cm².',
      difficulty: 'medium',
    },
    {
      text: 'In a quadrilateral, three angles are 95°, 85°, and 110°. What is the fourth angle?',
      options: ['70°', '80°', '60°', '90°'],
      correctIndex: 0,
      explanation: 'Sum = 360°. 95 + 85 + 110 = 290°. Fourth = 360 − 290 = 70°.',
      difficulty: 'medium',
    },
    {
      text: 'A cuboid measures 6 cm × 4 cm × 3 cm. What is its volume?',
      options: ['72 cm³', '52 cm³', '96 cm³', '48 cm³'],
      correctIndex: 0,
      explanation: 'Volume = 6 × 4 × 3 = 72 cm³.',
      difficulty: 'medium',
    },
    {
      text: 'A regular polygon has each interior angle equal to 135°. How many sides does it have?',
      options: ['8', '6', '9', '10'],
      correctIndex: 0,
      explanation: 'Exterior angle = 180 − 135 = 45°. Number of sides = 360 ÷ 45 = 8.',
      difficulty: 'medium',
    },
    {
      text: 'A triangle has angles in the ratio 2 : 3 : 4. What is the largest angle?',
      options: ['80°', '60°', '40°', '90°'],
      correctIndex: 0,
      explanation: 'Total parts = 9. Each part = 180 ÷ 9 = 20°. Largest = 4 × 20 = 80°.',
      difficulty: 'medium',
    },
    {
      text: 'What is the area of a compound shape consisting of a rectangle (10 cm × 5 cm) with a semicircle on one of the 10 cm sides? (Use π = 3.14)',
      options: ['89.25 cm²', '78.5 cm²', '100 cm²', '82.5 cm²'],
      correctIndex: 0,
      explanation: 'Rectangle = 50 cm². Semicircle radius = 5. Area = ½ × 3.14 × 5² = 39.25 cm². Total = 89.25 cm².',
      difficulty: 'medium',
    },
    {
      text: 'What is the surface area of a cube with side 5 cm?',
      options: ['150 cm²', '125 cm²', '25 cm²', '100 cm²'],
      correctIndex: 0,
      explanation: '6 faces, each 5 × 5 = 25 cm². Total = 6 × 25 = 150 cm².',
      difficulty: 'medium',
    },
  ],

  // ─────────────────────────────────────────────
  // SHAPE CITY — HARD (complex geometry, circles)
  // ─────────────────────────────────────────────
  shape_city_hard: [
    {
      text: 'A circle has diameter 14 cm. What is its area? (Use π = 22/7)',
      options: ['154 cm²', '44 cm²', '196 cm²', '88 cm²'],
      correctIndex: 0,
      explanation: 'Radius = 7 cm. Area = π × r² = 22/7 × 49 = 154 cm².',
      difficulty: 'hard',
    },
    {
      text: 'A cylinder has radius 3 cm and height 10 cm. What is its volume? (Use π = 3.14)',
      options: ['282.6 cm³', '188.4 cm³', '94.2 cm³', '376.8 cm³'],
      correctIndex: 0,
      explanation: 'V = π × r² × h = 3.14 × 9 × 10 = 282.6 cm³.',
      difficulty: 'hard',
    },
    {
      text: 'In triangle PQR, angle P = 54° and angle Q = 73°. What is angle R?',
      options: ['53°', '63°', '43°', '33°'],
      correctIndex: 0,
      explanation: '54 + 73 = 127. Angle R = 180 − 127 = 53°.',
      difficulty: 'hard',
    },
    {
      text: 'A circle has circumference 44 cm. What is its area? (Use π = 22/7)',
      options: ['154 cm²', '176 cm²', '132 cm²', '168 cm²'],
      correctIndex: 0,
      explanation: 'C = 2πr: 44 = 2 × 22/7 × r → r = 7. Area = 22/7 × 49 = 154 cm².',
      difficulty: 'hard',
    },
    {
      text: 'Two angles of an isosceles triangle are 32° each. What is the third angle?',
      options: ['116°', '64°', '148°', '126°'],
      correctIndex: 0,
      explanation: '32 + 32 = 64°. Third = 180 − 64 = 116°.',
      difficulty: 'hard',
    },
    {
      text: 'A sector of a circle has radius 6 cm and angle 90°. What is its area? (Use π = 3.14)',
      options: ['28.26 cm²', '56.52 cm²', '18.84 cm²', '37.68 cm²'],
      correctIndex: 0,
      explanation: 'Area = (90/360) × π × r² = ¼ × 3.14 × 36 = 28.26 cm².',
      difficulty: 'hard',
    },
    {
      text: 'A right-angled triangle has legs 9 cm and 12 cm. What is the length of the hypotenuse?',
      options: ['15 cm', '16 cm', '13 cm', '17 cm'],
      correctIndex: 0,
      explanation: 'Pythagoras: √(81 + 144) = √225 = 15 cm.',
      difficulty: 'hard',
    },
    {
      text: 'What is the sum of interior angles of a decagon (10 sides)?',
      options: ['1,440°', '1,260°', '1,800°', '1,080°'],
      correctIndex: 0,
      explanation: '(10 − 2) × 180° = 8 × 180° = 1,440°.',
      difficulty: 'hard',
    },
    {
      text: 'A cone has radius 7 cm and slant height 25 cm. What is its curved surface area? (Use π = 22/7)',
      options: ['550 cm²', '490 cm²', '616 cm²', '462 cm²'],
      correctIndex: 0,
      explanation: 'Curved surface = π × r × l = 22/7 × 7 × 25 = 550 cm².',
      difficulty: 'hard',
    },
    {
      text: 'An angle in a regular polygon is 140°. How many sides does it have?',
      options: ['9', '8', '10', '12'],
      correctIndex: 0,
      explanation: 'Exterior = 40°. Sides = 360 ÷ 40 = 9.',
      difficulty: 'hard',
    },
  ],

  // ─────────────────────────────────────────────
  // SEQUENCE BRIDGE — EASY (simple +/- sequences)
  // ─────────────────────────────────────────────
  sequence_bridge_easy: [
    {
      text: 'What is the next number? 4, 9, 14, 19, __',
      options: ['24', '23', '25', '22'],
      correctIndex: 0,
      explanation: 'Add 5 each time: 19 + 5 = 24.',
      difficulty: 'easy',
    },
    {
      text: 'What is the missing number? 3, 7, 11, __, 19',
      options: ['15', '14', '16', '13'],
      correctIndex: 0,
      explanation: 'Add 4 each time: 11 + 4 = 15.',
      difficulty: 'easy',
    },
    {
      text: 'What is the next term? 100, 93, 86, 79, __',
      options: ['72', '71', '73', '70'],
      correctIndex: 0,
      explanation: 'Subtract 7 each time: 79 − 7 = 72.',
      difficulty: 'easy',
    },
    {
      text: 'What is the missing number? 2, 4, 8, __, 32',
      options: ['16', '12', '14', '20'],
      correctIndex: 0,
      explanation: 'Multiply by 2 each time: 8 × 2 = 16.',
      difficulty: 'easy',
    },
    {
      text: 'What is the 10th term of the sequence: 6, 11, 16, 21, ...?',
      options: ['51', '56', '46', '61'],
      correctIndex: 0,
      explanation: 'nth term = 5n + 1. 10th = 5 × 10 + 1 = 51.',
      difficulty: 'easy',
    },
    {
      text: 'What is the next term? 1, 4, 9, 16, 25, __',
      options: ['36', '30', '35', '49'],
      correctIndex: 0,
      explanation: 'These are square numbers: 1², 2², 3², 4², 5², 6² = 36.',
      difficulty: 'easy',
    },
    {
      text: 'What is the missing number? 1, 1, 2, 3, 5, 8, __, 21',
      options: ['13', '11', '14', '12'],
      correctIndex: 0,
      explanation: 'Fibonacci: each term = sum of two before. 5 + 8 = 13.',
      difficulty: 'easy',
    },
    {
      text: 'What is the next term? 81, 27, 9, 3, __',
      options: ['1', '2', '0', '1/3'],
      correctIndex: 0,
      explanation: 'Divide by 3 each time: 3 ÷ 3 = 1.',
      difficulty: 'easy',
    },
    {
      text: 'Find the missing number: 50, 43, __, 29, 22',
      options: ['36', '37', '35', '34'],
      correctIndex: 0,
      explanation: 'Subtract 7 each time: 43 − 7 = 36.',
      difficulty: 'easy',
    },
    {
      text: 'What is the next number? 0.5, 1, 1.5, 2, __',
      options: ['2.5', '3', '2.25', '4'],
      correctIndex: 0,
      explanation: 'Add 0.5 each time: 2 + 0.5 = 2.5.',
      difficulty: 'easy',
    },
  ],

  // ─────────────────────────────────────────────
  // SEQUENCE BRIDGE — MEDIUM (multiplicative, ratio)
  // ─────────────────────────────────────────────
  sequence_bridge_medium: [
    {
      text: 'Find the nth term of the sequence: 5, 9, 13, 17, ...',
      options: ['4n + 1', '5n', '3n + 2', '4n − 1'],
      correctIndex: 0,
      explanation: 'Difference = 4. First term: 4×1 + ? = 5, so nth term = 4n + 1.',
      difficulty: 'medium',
    },
    {
      text: 'What is the 50th term of 3, 7, 11, 15, ...?',
      options: ['199', '203', '195', '201'],
      correctIndex: 0,
      explanation: 'nth term = 4n − 1. 50th = 4 × 50 − 1 = 199.',
      difficulty: 'medium',
    },
    {
      text: 'A sequence has nth term 3n² + 1. What is the 5th term?',
      options: ['76', '46', '56', '66'],
      correctIndex: 0,
      explanation: '3 × 25 + 1 = 75 + 1 = 76.',
      difficulty: 'medium',
    },
    {
      text: 'Which term in the sequence 6, 10, 14, 18, ... equals 86?',
      options: ['21st', '20th', '22nd', '19th'],
      correctIndex: 0,
      explanation: '4n + 2 = 86 → 4n = 84 → n = 21.',
      difficulty: 'medium',
    },
    {
      text: 'The sequence 3, 6, 12, 24, ... What is the 8th term?',
      options: ['384', '256', '192', '512'],
      correctIndex: 0,
      explanation: 'Multiply by 2: 3 × 2⁷ = 3 × 128 = 384.',
      difficulty: 'medium',
    },
    {
      text: 'Find the missing term: 2, 6, 18, __, 162',
      options: ['54', '36', '72', '48'],
      correctIndex: 0,
      explanation: 'Multiply by 3: 18 × 3 = 54.',
      difficulty: 'medium',
    },
    {
      text: 'The 5th and 6th terms of a linear sequence are 29 and 35. What is the 1st term?',
      options: ['5', '7', '3', '11'],
      correctIndex: 0,
      explanation: 'Difference = 6. Going back 4 steps from 5th term (29): 29 − 4×6 = 29 − 24 = 5.',
      difficulty: 'medium',
    },
    {
      text: 'What is the sum of the first 10 terms of: 2, 4, 6, 8, ...?',
      options: ['110', '100', '120', '90'],
      correctIndex: 0,
      explanation: 'Sum of first n even numbers = n(n+1). For n=10: 10 × 11 = 110.',
      difficulty: 'medium',
    },
    {
      text: 'A sequence starts 5, 8, 13, 20, 29, ... What is the next term?',
      options: ['40', '38', '42', '36'],
      correctIndex: 0,
      explanation: 'Differences: 3, 5, 7, 9, 11... Next difference = 11. 29 + 11 = 40.',
      difficulty: 'medium',
    },
    {
      text: 'The nth term of a sequence is 2n + 5. Which is the first term greater than 50?',
      options: ['23rd', '22nd', '24th', '25th'],
      correctIndex: 0,
      explanation: '2n + 5 > 50 → 2n > 45 → n > 22.5. So first whole number is n = 23.',
      difficulty: 'medium',
    },
  ],

  // ─────────────────────────────────────────────
  // SEQUENCE BRIDGE — HARD (complex, algebraic patterns)
  // ─────────────────────────────────────────────
  sequence_bridge_hard: [
    {
      text: 'The nth term of a sequence is n² − 3n + 2. What is the 10th term?',
      options: ['72', '82', '62', '90'],
      correctIndex: 0,
      explanation: '10² − 3×10 + 2 = 100 − 30 + 2 = 72.',
      difficulty: 'hard',
    },
    {
      text: 'A sequence begins 1, 3, 7, 13, 21, ... What is the nth term?',
      options: ['n² − n + 1', 'n² + 1', '2n − 1', 'n² + n − 1'],
      correctIndex: 0,
      explanation: 'Second differences are constant (2), so quadratic. Formula: n² − n + 1. Check: 1²−1+1=1 ✓, 2²−2+1=3 ✓.',
      difficulty: 'hard',
    },
    {
      text: 'A geometric sequence has first term 4 and common ratio 1.5. What is the 5th term?',
      options: ['20.25', '18.75', '24', '13.5'],
      correctIndex: 0,
      explanation: '4 × 1.5⁴ = 4 × 5.0625 = 20.25.',
      difficulty: 'hard',
    },
    {
      text: 'The sum of the first n terms of a sequence is n² + 3n. What is the 5th term (not sum)?',
      options: ['12', '10', '14', '8'],
      correctIndex: 0,
      explanation: 'S₅ = 25 + 15 = 40. S₄ = 16 + 12 = 28. 5th term = S₅ − S₄ = 12.',
      difficulty: 'hard',
    },
    {
      text: 'In the sequence 1, 2, 4, 8, 16, ... what is the sum of the first 8 terms?',
      options: ['255', '256', '254', '128'],
      correctIndex: 0,
      explanation: 'Sum of geometric series = a(rⁿ−1)/(r−1) = 1(2⁸−1)/(2−1) = 255.',
      difficulty: 'hard',
    },
    {
      text: 'A sequence has second differences of 6. The first two terms are 3 and 10. What is the 4th term?',
      options: ['33', '27', '39', '24'],
      correctIndex: 0,
      explanation: 'Differences: d₁=7, d₂=7+6=13, d₃=13+6=19. Term3=10+13=23, Term4=23+10 — wait: term3=10+13=23, term4=23+16=... let me redo. d(1)=10-3=7. Second diff=6, so d(2)=13, d(3)=19. Term3=10+13=23. Term4=23+10=33.',
      difficulty: 'hard',
    },
    {
      text: 'What is the sum of the first 20 odd numbers?',
      options: ['400', '380', '420', '361'],
      correctIndex: 0,
      explanation: 'Sum of first n odd numbers = n². For n=20: 20² = 400.',
      difficulty: 'hard',
    },
    {
      text: 'A sequence: 1, 5, 14, 30, 55, ... These are sums of squares. What is the 6th term?',
      options: ['91', '84', '100', '77'],
      correctIndex: 0,
      explanation: '1+4+9+16+25+36 = 91. Each term adds the next perfect square.',
      difficulty: 'hard',
    },
    {
      text: 'The nth term of a sequence is (2n+1)/(n+2). As n gets very large, what value does it approach?',
      options: ['2', '1', '3', '0'],
      correctIndex: 0,
      explanation: 'Divide top and bottom by n: (2+1/n)/(1+2/n) → 2/1 = 2 as n→∞.',
      difficulty: 'hard',
    },
    {
      text: 'A sequence has terms: a, a+d, a+2d, ... The 3rd term is 19 and the 7th term is 39. What is the 15th term?',
      options: ['79', '89', '69', '99'],
      correctIndex: 0,
      explanation: 'From 3rd to 7th is 4d=20, so d=5. a=19−2×5=9. 15th = 9+14×5 = 79.',
      difficulty: 'hard',
    },
  ],

  // ─────────────────────────────────────────────
  // PROBLEM PALACE — EASY (single-step word problems)
  // ─────────────────────────────────────────────
  problem_palace_easy: [
    {
      text: 'A box of 24 chocolates costs £3.60. What is the cost per chocolate?',
      options: ['15p', '12p', '18p', '20p'],
      correctIndex: 0,
      explanation: '360p ÷ 24 = 15p per chocolate.',
      difficulty: 'easy',
    },
    {
      text: 'A train leaves at 08:45 and arrives at 11:20. How long is the journey?',
      options: ['2 h 35 min', '2 h 25 min', '2 h 45 min', '3 h 5 min'],
      correctIndex: 0,
      explanation: '08:45 to 11:20 = 2 hours 35 minutes.',
      difficulty: 'easy',
    },
    {
      text: 'A bag weighs 4.75 kg. Another weighs 3.6 kg. What is their total weight?',
      options: ['8.35 kg', '8.15 kg', '8.45 kg', '7.35 kg'],
      correctIndex: 0,
      explanation: '4.75 + 3.60 = 8.35 kg.',
      difficulty: 'easy',
    },
    {
      text: 'There are 48 biscuits shared equally among 6 children. How many does each child get?',
      options: ['8', '6', '9', '7'],
      correctIndex: 0,
      explanation: '48 ÷ 6 = 8 biscuits each.',
      difficulty: 'easy',
    },
    {
      text: 'A shop has 350 apples on Monday. 127 are sold. How many remain?',
      options: ['223', '213', '233', '243'],
      correctIndex: 0,
      explanation: '350 − 127 = 223.',
      difficulty: 'easy',
    },
    {
      text: 'A car travels at 60 km/h. How far does it go in 2.5 hours?',
      options: ['150 km', '120 km', '180 km', '160 km'],
      correctIndex: 0,
      explanation: '60 × 2.5 = 150 km.',
      difficulty: 'easy',
    },
    {
      text: 'A shirt costs £18.50. A pair of trousers costs twice as much. What do they cost together?',
      options: ['£55.50', '£37.00', '£45.50', '£47.50'],
      correctIndex: 0,
      explanation: 'Trousers = £37.00. Total = £18.50 + £37.00 = £55.50.',
      difficulty: 'easy',
    },
    {
      text: 'It takes 4 painters 6 days to paint a house. How long would 8 painters take?',
      options: ['3 days', '4 days', '2 days', '5 days'],
      correctIndex: 0,
      explanation: 'Double the painters = half the time. 6 ÷ 2 = 3 days.',
      difficulty: 'easy',
    },
    {
      text: 'A bottle holds 1.5 litres of juice. How many 250 ml glasses can it fill?',
      options: ['6', '5', '7', '4'],
      correctIndex: 0,
      explanation: '1.5 litres = 1,500 ml. 1,500 ÷ 250 = 6 glasses.',
      difficulty: 'easy',
    },
    {
      text: 'A rectangle has area 91 cm². One side is 7 cm. What is the other side?',
      options: ['13 cm', '14 cm', '11 cm', '12 cm'],
      correctIndex: 0,
      explanation: '91 ÷ 7 = 13 cm.',
      difficulty: 'easy',
    },
  ],

  // ─────────────────────────────────────────────
  // PROBLEM PALACE — MEDIUM (two-step word problems)
  // ─────────────────────────────────────────────
  problem_palace_medium: [
    {
      text: 'A cinema sells 430 adult tickets at £8.50 and 185 child tickets at £5.00. What is the total revenue?',
      options: ['£4,580', '£4,480', '£4,680', '£4,380'],
      correctIndex: 0,
      explanation: '430 × £8.50 = £3,655. 185 × £5 = £925. Total = £4,580.',
      difficulty: 'medium',
    },
    {
      text: 'Tom is 3 times as old as Sam. In 6 years Tom will be twice Sam\'s age. How old is Sam now?',
      options: ['6', '4', '8', '12'],
      correctIndex: 0,
      explanation: 'Let Sam = s, Tom = 3s. 3s + 6 = 2(s + 6) → 3s + 6 = 2s + 12 → s = 6.',
      difficulty: 'medium',
    },
    {
      text: 'A train journey of 360 km takes 3 hours. After improvements it takes 2 h 24 min. By how much has the average speed increased?',
      options: ['30 km/h', '25 km/h', '20 km/h', '35 km/h'],
      correctIndex: 0,
      explanation: 'Old speed = 120 km/h. New time = 2.4 h. New speed = 360/2.4 = 150 km/h. Increase = 30 km/h.',
      difficulty: 'medium',
    },
    {
      text: 'Apples cost 45p each and oranges 60p each. Jane buys some of each and spends exactly £3.90. She buys at least one of each. How many apples did she buy?',
      options: ['6', '4', '2', '3'],
      correctIndex: 0,
      explanation: '6 apples (270p) + 2 oranges (120p) = 390p. Check: 45×6 + 60×2 = 270 + 120 = 390p ✓.',
      difficulty: 'medium',
    },
    {
      text: 'The ratio of boys to girls in a class is 3 : 4. There are 21 boys. How many students in total?',
      options: ['49', '35', '42', '56'],
      correctIndex: 0,
      explanation: '3 parts = 21, so 1 part = 7. Girls = 4 × 7 = 28. Total = 21 + 28 = 49.',
      difficulty: 'medium',
    },
    {
      text: 'A cyclist completes a 45 km route at 15 km/h. They rest for 30 minutes then return the same way at 18 km/h. What is the total time for the whole trip?',
      options: ['6 h', '5 h 30 min', '6 h 30 min', '5 h'],
      correctIndex: 0,
      explanation: 'Out: 45/15 = 3 h. Rest: 0.5 h. Back: 45/18 = 2.5 h. Total = 6 h.',
      difficulty: 'medium',
    },
    {
      text: 'A school hall can seat 420 people. For a concert, 5/7 of seats are filled. 35 more people arrive. How many empty seats are there now?',
      options: ['85', '105', '65', '120'],
      correctIndex: 0,
      explanation: '5/7 × 420 = 300 seated. After 35 more: 335 seated. Empty = 420 − 335 = 85.',
      difficulty: 'medium',
    },
    {
      text: 'In a sale, a coat is reduced by 30% to £98. What was the original price?',
      options: ['£140', '£128', '£133', '£150'],
      correctIndex: 0,
      explanation: '70% = £98. 1% = £1.40. 100% = £140.',
      difficulty: 'medium',
    },
    {
      text: 'A recipe for 6 serves uses 450g of rice. How much rice is needed for 10 servings?',
      options: ['750 g', '700 g', '800 g', '900 g'],
      correctIndex: 0,
      explanation: 'Per serving = 75 g. For 10 = 750 g.',
      difficulty: 'medium',
    },
    {
      text: 'A car uses 8 litres of petrol per 100 km. Petrol costs £1.65 per litre. What is the fuel cost for a 350 km journey?',
      options: ['£46.20', '£52.80', '£42.00', '£39.60'],
      correctIndex: 0,
      explanation: '350 km needs 28 litres. 28 × £1.65 = £46.20.',
      difficulty: 'medium',
    },
  ],

  // ─────────────────────────────────────────────
  // PROBLEM PALACE — HARD (multi-step reasoning)
  // ─────────────────────────────────────────────
  problem_palace_hard: [
    {
      text: 'Three taps fill a tank. Tap A fills in 3 hours, Tap B in 4 hours, Tap C in 6 hours. How long to fill the tank with all three running?',
      options: ['80 minutes', '72 minutes', '90 minutes', '96 minutes'],
      correctIndex: 0,
      explanation: 'In 1 hour: 1/3 + 1/4 + 1/6 = 4/12 + 3/12 + 2/12 = 9/12 = 3/4. Time = 4/3 hours = 80 minutes.',
      difficulty: 'hard',
    },
    {
      text: 'In a class of 30 students, 18 study French, 15 study Spanish and 8 study both. How many study neither?',
      options: ['5', '3', '7', '8'],
      correctIndex: 0,
      explanation: 'French or Spanish = 18 + 15 − 8 = 25. Neither = 30 − 25 = 5.',
      difficulty: 'hard',
    },
    {
      text: 'The average of five numbers is 18. The average of four of them is 15. What is the fifth number?',
      options: ['30', '25', '35', '20'],
      correctIndex: 0,
      explanation: 'Sum of five = 90. Sum of four = 60. Fifth = 90 − 60 = 30.',
      difficulty: 'hard',
    },
    {
      text: 'A and B share £560 in ratio 5 : 3. B gives 1/4 of his share to C. How much does C receive?',
      options: ['£52.50', '£42.00', '£70.00', '£35.00'],
      correctIndex: 0,
      explanation: 'B = 3/8 × £560 = £210. C = 1/4 × £210 = £52.50.',
      difficulty: 'hard',
    },
    {
      text: 'A boat travels 24 km upstream in 3 hours and 24 km downstream in 2 hours. What is the speed of the current?',
      options: ['2 km/h', '3 km/h', '4 km/h', '1 km/h'],
      correctIndex: 0,
      explanation: 'Upstream speed = 8 km/h. Downstream = 12 km/h. Current = (12 − 8)/2 = 2 km/h.',
      difficulty: 'hard',
    },
    {
      text: 'A fence 120 m long encloses a rectangular garden. The length is 3 times the width. What is the area?',
      options: ['675 m²', '900 m²', '540 m²', '720 m²'],
      correctIndex: 0,
      explanation: '2(l + w) = 120. l = 3w → 2(4w) = 120 → w = 15. l = 45. Area = 675 m².',
      difficulty: 'hard',
    },
    {
      text: 'A tank is 3/4 full. After removing 60 litres it is 1/2 full. What is the capacity?',
      options: ['240 litres', '180 litres', '300 litres', '160 litres'],
      correctIndex: 0,
      explanation: '3/4 − 1/2 = 1/4 = 60 litres. Full capacity = 60 × 4 = 240 litres.',
      difficulty: 'hard',
    },
    {
      text: 'Three workers can complete a job in 8 days. After 4 days, one worker leaves. How many more days to finish?',
      options: ['6 days', '4 days', '8 days', '5 days'],
      correctIndex: 0,
      explanation: '3 workers do 1/8 per day. After 4 days: 4/8 = 1/2 done. 2 workers do 1/12 per day. Remaining 1/2 takes (1/2)/(1/12) = 6 days.',
      difficulty: 'hard',
    },
    {
      text: 'A merchant buys goods for £2,400. He sells 60% at a profit of 25% and the rest at a loss of 20%. What is the overall profit or loss?',
      options: ["£168 profit", "£120 profit", "£48 profit", "£96 profit"],
      correctIndex: 0,
      explanation: "60% of £2,400 = £1,440 at 25% profit = £1,800. 40% = £960 at 20% loss = £768. Revenue = £2,568. Profit = £168.",
      difficulty: 'hard',
    },
    {
      text: 'The price of a television fell 10% last year and 15% this year. What is the overall percentage decrease?',
      options: ['23.5%', '25%', '22%', '20%'],
      correctIndex: 0,
      explanation: '100 × 0.9 × 0.85 = 76.5. Decrease = 100 − 76.5 = 23.5%.',
      difficulty: 'hard',
    },
  ],
};

export function seedQuestions(): void {
  const db = getDb();
  let totalSeeded = 0;

  for (const [assessmentKey, specs] of Object.entries(questionsByAssessment)) {
    const assessmentId = ASSESSMENT_IDS[assessmentKey];
    if (!assessmentId) {
      console.warn(`  Warning: No assessment ID for key "${assessmentKey}" — skipping.`);
      continue;
    }

    const questionIds: string[] = [];

    for (const spec of specs) {
      const id = uuidv4();
      questionIds.push(id);
      db.prepare(`
        INSERT INTO questions (id, assessment_id, text, options, correct_index, explanation, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        assessmentId,
        spec.text,
        JSON.stringify(spec.options),
        spec.correctIndex,
        spec.explanation,
        spec.difficulty,
      );
      totalSeeded++;
    }

    db.prepare(`UPDATE assessments SET question_ids = ? WHERE id = ?`)
      .run(JSON.stringify(questionIds), assessmentId);
  }

  console.log(`  Seeded: ${totalSeeded} questions across ${Object.keys(questionsByAssessment).length} assessments`);
}
