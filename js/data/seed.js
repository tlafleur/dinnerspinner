// Seed data: sample meals, sides and build-a-plate components.
// Ingredient lines are plain text ("1.5 lb chicken thighs") and are parsed by engine.parseIngredient.
// Quantities are for `serves` people (default 4).
//
// ok: dietary compatibility tags the meal satisfies as written:
//   veg (vegetarian), vegan, gf (gluten-free), df (dairy-free), nf (nut-free)
// protein: main protein; used for "no pork/no beef/pescatarian" rules and for variety.
// kid: 1 (adventurous) .. 5 (classic kid pleaser). Used as a prior before the family rates things.

export const CUISINES = ['American', 'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'Comfort', 'BBQ'];
export const PROTEINS = ['chicken', 'beef', 'pork', 'turkey', 'sausage', 'fish', 'shrimp', 'egg', 'cheese', 'beans', 'tofu', 'none'];
export const DIET_TAGS = [
  ['veg', 'Vegetarian', '🥬'],
  ['vegan', 'Vegan', '🌱'],
  ['gf', 'Gluten-free', '🌾'],
  ['df', 'Dairy-free', '🥛'],
  ['nf', 'Nut-free', '🥜'],
  ['no-pork', 'No pork', '🐷'],
  ['no-beef', 'No beef', '🐮'],
  ['pesc', 'Pescatarian', '🐟'],
];

const M = (id, name, emoji, cuisine, protein, time, kid, ok, ing, tip) =>
  ({ id, name, emoji, cuisine, protein, time, kid, ok, serves: 4, ing, tip: tip || '' });

export const SEED_MEALS = [
  M('spaghetti-meatballs', 'Spaghetti & Meatballs', '🍝', 'Italian', 'beef', 35, 5, ['nf'],
    ['1 lb spaghetti', '1 lb ground beef', '1/2 cup breadcrumbs', '1 egg', '1/4 cup parmesan', '24 oz marinara sauce', '1 onion', '2 clove garlic', '1 tsp italian seasoning']),
  M('chicken-tacos', 'Chicken Tacos', '🌮', 'Mexican', 'chicken', 25, 5, ['gf', 'df', 'nf'],
    ['1.5 lb chicken breast', '1 pkg taco seasoning', '12 corn tortillas', '1 cup shredded cheddar', '1 head lettuce', '2 tomato', '1 cup salsa', '1/2 cup sour cream', '1 lime'],
    'Skip the cheese and sour cream to keep it dairy-free.'),
  M('sheet-pan-chicken', 'Sheet-Pan Chicken & Veggies', '🍗', 'American', 'chicken', 40, 4, ['gf', 'df', 'nf'],
    ['2 lb chicken thighs', '1 lb baby potatoes', '1 lb broccoli', '2 carrot', '3 tbsp olive oil', '1 tsp paprika', '1 tsp garlic powder', '1 lemon']),
  M('mac-cheese', 'Mac & Cheese with Peas', '🧀', 'Comfort', 'cheese', 25, 5, ['veg', 'nf'],
    ['1 lb elbow pasta', '3 cup shredded cheddar', '2 cup milk', '3 tbsp butter', '3 tbsp flour', '1 cup frozen peas', '1/2 tsp mustard powder']),
  M('cheeseburgers', 'Cheeseburgers & Fries', '🍔', 'American', 'beef', 30, 5, ['nf'],
    ['1.5 lb ground beef', '4 hamburger buns', '4 slice cheddar', '1 head lettuce', '1 tomato', '1 onion', '1 bag frozen fries', '1 jar pickles', '1/4 cup ketchup']),
  M('chicken-stir-fry', 'Chicken Stir-Fry', '🥡', 'Asian', 'chicken', 25, 3, ['df', 'nf'],
    ['1.5 lb chicken breast', '1 bag frozen stir-fry vegetables', '2 cup rice', '3 tbsp soy sauce', '1 tbsp honey', '1 tbsp cornstarch', '2 clove garlic', '1 tbsp ginger', '2 scallion']),
  M('veggie-quesadillas', 'Veggie Quesadillas', '🫓', 'Mexican', 'cheese', 15, 5, ['veg', 'nf'],
    ['8 flour tortillas', '2 cup shredded cheese', '1 can black beans', '1 bell pepper', '1 cup frozen corn', '1 cup salsa', '1 avocado', '1/2 cup sour cream']),
  M('salmon-rice', 'Salmon with Rice & Broccoli', '🐟', 'American', 'fish', 25, 3, ['gf', 'df', 'nf'],
    ['1.5 lb salmon fillets', '2 cup rice', '1 lb broccoli', '1 lemon', '2 tbsp olive oil', '1 tsp garlic powder', '2 tbsp soy sauce']),
  M('pulled-pork', 'Slow Cooker Pulled Pork Sandwiches', '🐖', 'BBQ', 'pork', 20, 4, ['df', 'nf'],
    ['3 lb pork shoulder', '1 cup bbq sauce', '1 onion', '8 hamburger buns', '1 bag coleslaw mix', '1/4 cup mayo', '1 tbsp apple cider vinegar'],
    'Start the slow cooker by lunchtime. 20 minutes of hands-on time.'),
  M('pizza-night', 'Pepperoni Pizza Night', '🍕', 'Italian', 'pork', 25, 5, ['nf'],
    ['1 lb pizza dough', '1 cup pizza sauce', '2 cup shredded mozzarella', '4 oz pepperoni', '1 tsp italian seasoning', '1 tbsp olive oil'],
    'Let the kids build their own halves.'),
  M('chicken-noodle-soup', 'Chicken Noodle Soup', '🍜', 'Comfort', 'chicken', 40, 4, ['df', 'nf'],
    ['1 lb chicken breast', '8 cup chicken broth', '3 carrot', '3 stalk celery', '1 onion', '8 oz egg noodles', '2 clove garlic', '1 tsp thyme', '1 bunch parsley']),
  M('beef-tacos', 'Beef Tacos', '🌮', 'Mexican', 'beef', 20, 5, ['gf', 'nf'],
    ['1 lb ground beef', '1 pkg taco seasoning', '12 taco shells', '1 cup shredded cheddar', '1 head lettuce', '2 tomato', '1 cup salsa', '1/2 cup sour cream']),
  M('caesar-wraps', 'Chicken Caesar Wraps', '🌯', 'American', 'chicken', 20, 3, ['nf'],
    ['1 lb chicken breast', '1 head romaine lettuce', '1/2 cup caesar dressing', '1/2 cup parmesan', '1 cup croutons', '4 flour tortillas']),
  M('breakfast-dinner', 'Breakfast for Dinner', '🥞', 'American', 'egg', 25, 5, ['veg', 'nf'],
    ['2 cup pancake mix', '8 egg', '8 slice bacon', '1 cup milk', '1/2 cup maple syrup', '2 banana', '1 cup berries'],
    'Vegetarian if you skip the bacon.'),
  M('teriyaki-bowls', 'Teriyaki Chicken Bowls', '🍱', 'Asian', 'chicken', 30, 4, ['df', 'nf'],
    ['1.5 lb chicken thighs', '2 cup rice', '1/2 cup teriyaki sauce', '1 lb broccoli', '1 carrot', '2 scallion', '1 tbsp sesame seeds', '1 cucumber']),
  M('baked-ziti', 'Baked Ziti', '🍲', 'Italian', 'beef', 45, 5, ['nf'],
    ['1 lb ziti', '1 lb ground beef', '24 oz marinara sauce', '15 oz ricotta', '2 cup shredded mozzarella', '1/2 cup parmesan', '1 egg', '2 clove garlic']),
  M('fish-sticks', 'Fish Sticks & Tater Tots', '🐠', 'Comfort', 'fish', 25, 5, ['df', 'nf'],
    ['1 box frozen fish sticks', '1 bag frozen tater tots', '1 cup frozen peas', '1/4 cup ketchup', '1 lemon', '1/2 cup tartar sauce']),
  M('chicken-fajitas', 'Chicken Fajitas', '🫑', 'Mexican', 'chicken', 30, 4, ['df', 'nf'],
    ['1.5 lb chicken breast', '3 bell pepper', '1 onion', '1 pkg fajita seasoning', '8 flour tortillas', '1 lime', '1 cup shredded cheese', '1/2 cup sour cream', '1 avocado']),
  M('veggie-fried-rice', 'Veggie Fried Rice', '🍚', 'Asian', 'egg', 20, 4, ['veg', 'df', 'nf'],
    ['3 cup rice', '4 egg', '2 cup frozen peas and carrots', '3 tbsp soy sauce', '2 scallion', '2 clove garlic', '1 tbsp sesame oil', '1 tbsp vegetable oil'],
    'Day-old rice fries best.'),
  M('butter-chicken', 'Butter Chicken', '🍛', 'Indian', 'chicken', 40, 3, ['gf', 'nf'],
    ['1.5 lb chicken thighs', '1 can crushed tomatoes', '1 cup heavy cream', '4 tbsp butter', '1 onion', '3 clove garlic', '1 tbsp ginger', '2 tbsp garam masala', '2 cup basmati rice', '4 naan']),
  M('chili-cornbread', 'Chili & Cornbread', '🌶️', 'American', 'beef', 50, 3, ['nf'],
    ['1 lb ground beef', '2 can kidney beans', '1 can diced tomatoes', '1 onion', '2 tbsp chili powder', '1 tsp cumin', '1 box cornbread mix', '1 cup shredded cheddar', '1/2 cup sour cream']),
  M('bbq-drumsticks', 'BBQ Chicken Drumsticks', '🍖', 'BBQ', 'chicken', 45, 4, ['gf', 'df', 'nf'],
    ['3 lb chicken drumsticks', '1 cup bbq sauce', '1 tbsp olive oil', '1 tsp paprika', '4 ear corn', '1 bag coleslaw mix', '1/4 cup mayo']),
  M('shrimp-scampi', 'Shrimp Scampi Pasta', '🍤', 'Italian', 'shrimp', 25, 3, ['nf'],
    ['1 lb linguine', '1 lb shrimp', '4 tbsp butter', '4 clove garlic', '1 lemon', '1 bunch parsley', '1/2 cup white wine', '1/2 tsp red pepper flakes']),
  M('greek-bowls', 'Greek Chicken Bowls', '🫒', 'Mediterranean', 'chicken', 30, 3, ['gf', 'nf'],
    ['1.5 lb chicken breast', '2 cup rice', '1 cucumber', '2 tomato', '1/2 cup feta', '1 cup tzatziki', '1 lemon', '1 tsp oregano', '1/2 red onion', '1/2 cup kalamata olives']),
  M('grilled-cheese-soup', 'Grilled Cheese & Tomato Soup', '🥪', 'Comfort', 'cheese', 20, 5, ['veg', 'nf'],
    ['8 slice bread', '8 slice cheddar', '4 tbsp butter', '2 can tomato soup', '1 cup milk']),
  M('meatball-subs', 'Turkey Meatball Subs', '🥖', 'Italian', 'turkey', 35, 4, ['nf'],
    ['1 lb ground turkey', '1/2 cup breadcrumbs', '1 egg', '1/4 cup parmesan', '24 oz marinara sauce', '4 sub rolls', '1 cup shredded mozzarella', '1 tsp italian seasoning']),
  M('beef-broccoli', 'Beef & Broccoli', '🥦', 'Asian', 'beef', 30, 3, ['df', 'nf'],
    ['1.5 lb flank steak', '1 lb broccoli', '1/4 cup soy sauce', '2 tbsp brown sugar', '1 tbsp cornstarch', '3 clove garlic', '1 tbsp ginger', '2 cup rice']),
  M('sloppy-joes', 'Sloppy Joes', '🥪', 'American', 'beef', 25, 5, ['df', 'nf'],
    ['1.5 lb ground beef', '1 onion', '1 bell pepper', '1 cup ketchup', '2 tbsp brown sugar', '1 tbsp worcestershire sauce', '8 hamburger buns', '1 bag frozen fries']),
  M('chicken-parm', 'Chicken Parmesan', '🍗', 'Italian', 'chicken', 40, 4, ['nf'],
    ['4 chicken breast', '1 cup breadcrumbs', '2 egg', '1/2 cup parmesan', '24 oz marinara sauce', '1 cup shredded mozzarella', '1 lb spaghetti']),
  M('burrito-bowls', 'Black Bean Burrito Bowls', '🫘', 'Mexican', 'beans', 25, 4, ['veg', 'gf', 'nf'],
    ['2 cup rice', '2 can black beans', '1 cup frozen corn', '1 cup salsa', '1 avocado', '1 lime', '1 cup shredded cheese', '1/2 cup sour cream', '1 bunch cilantro'],
    'Vegan without the cheese and sour cream.'),
  M('lemon-shrimp', 'Lemon Garlic Shrimp & Rice', '🍤', 'American', 'shrimp', 20, 3, ['gf', 'nf'],
    ['1 lb shrimp', '2 cup rice', '4 clove garlic', '1 lemon', '3 tbsp butter', '1 lb asparagus', '1 bunch parsley']),
  M('pork-chops', 'Pork Chops & Applesauce', '🍎', 'American', 'pork', 30, 4, ['gf', 'df', 'nf'],
    ['4 pork chops', '1 jar applesauce', '1 lb green beans', '1.5 lb potatoes', '2 tbsp olive oil', '1 tsp garlic powder', '1 tsp paprika']),
  M('pesto-pasta', 'Pesto Pasta with Chicken', '🌿', 'Italian', 'chicken', 25, 4, [],
    ['1 lb penne', '1 lb chicken breast', '1 cup pesto', '1 pint cherry tomatoes', '1/2 cup parmesan', '1 cup frozen peas'],
    'Pesto usually contains pine nuts.'),
  M('coconut-curry', 'Veggie Coconut Curry', '🥥', 'Indian', 'tofu', 30, 2, ['veg', 'vegan', 'gf', 'df', 'nf'],
    ['1 can coconut milk', '2 tbsp curry paste', '14 oz tofu', '1 sweet potato', '1 bag spinach', '1 onion', '2 clove garlic', '2 cup rice', '1 lime']),
  M('hot-dogs', 'Hot Dogs & Baked Beans', '🌭', 'American', 'pork', 15, 5, ['df', 'nf'],
    ['8 hot dogs', '8 hot dog buns', '1 can baked beans', '1 bag potato chips', '2 carrot', '1/4 cup ketchup', '2 tbsp mustard']),
  M('chicken-alfredo', 'Chicken Alfredo', '🍝', 'Italian', 'chicken', 30, 5, ['nf'],
    ['1 lb fettuccine', '1 lb chicken breast', '1 cup heavy cream', '4 tbsp butter', '1 cup parmesan', '3 clove garlic', '1 lb broccoli']),
  M('tuna-melts', 'Tuna Melts', '🐟', 'American', 'fish', 15, 3, ['nf'],
    ['2 can tuna', '1/3 cup mayo', '1 stalk celery', '8 slice bread', '8 slice cheddar', '1 tomato', '2 tbsp butter']),
  M('lentil-soup', 'Lentil Soup & Crusty Bread', '🥣', 'Mediterranean', 'beans', 45, 2, ['veg', 'vegan', 'df', 'nf'],
    ['1.5 cup lentils', '6 cup vegetable broth', '1 onion', '3 carrot', '3 stalk celery', '1 can diced tomatoes', '2 clove garlic', '1 tsp cumin', '1 baguette']),
  M('egg-roll-bowl', 'Egg Roll in a Bowl', '🥬', 'Asian', 'pork', 25, 3, ['df', 'nf'],
    ['1 lb ground pork', '1 bag coleslaw mix', '3 tbsp soy sauce', '1 tbsp sesame oil', '3 clove garlic', '1 tbsp ginger', '3 scallion', '2 cup rice']),
  M('nuggets-platter', 'Chicken Nuggets & Veggie Platter', '🍗', 'Comfort', 'chicken', 20, 5, ['df', 'nf'],
    ['1 bag frozen chicken nuggets', '2 carrot', '1 cucumber', '1 cup snap peas', '1 cup cherry tomatoes', '1/2 cup ranch dressing', '1 bag frozen fries', '1/4 cup ketchup']),
  M('steak-potatoes', 'Steak & Baked Potatoes', '🥩', 'American', 'beef', 40, 3, ['gf', 'nf'],
    ['1.5 lb sirloin steak', '4 russet potatoes', '4 tbsp butter', '1/2 cup sour cream', '2 scallion', '1 lb green beans', '1 tsp garlic powder']),
  M('chicken-pot-pie', 'Chicken Pot Pie', '🥧', 'Comfort', 'chicken', 50, 4, ['nf'],
    ['1 rotisserie chicken', '2 cup frozen peas and carrots', '1 onion', '3 tbsp butter', '3 tbsp flour', '2 cup chicken broth', '1/2 cup milk', '1 pkg pie crust']),
  M('shrimp-tacos', 'Shrimp Tacos', '🌮', 'Mexican', 'shrimp', 25, 3, ['gf', 'df', 'nf'],
    ['1 lb shrimp', '12 corn tortillas', '1 bag coleslaw mix', '1 lime', '1/2 cup mayo', '1 tsp chili powder', '1 avocado', '1 bunch cilantro']),
  M('rotisserie-dinner', 'Rotisserie Chicken Dinner', '🍗', 'American', 'chicken', 15, 5, ['gf', 'df', 'nf'],
    ['1 rotisserie chicken', '1 bag salad mix', '1 pkg microwave rice', '1 lb green beans', '1 baguette', '1/4 cup salad dressing'],
    'The ultimate no-cook weeknight.'),
  M('pita-pizzas', 'Pita Pizzas', '🍕', 'Mediterranean', 'cheese', 15, 5, ['veg', 'nf'],
    ['6 pita', '1 cup pizza sauce', '2 cup shredded mozzarella', '1 bell pepper', '1 cup mushrooms', '1 tsp italian seasoning']),
  M('ramen-upgrade', 'Ramen Upgrade', '🍜', 'Asian', 'egg', 15, 4, ['df', 'nf'],
    ['4 pkg ramen noodles', '4 egg', '2 scallion', '1 cup frozen corn', '1 bag spinach', '2 tbsp soy sauce', '1 tsp sesame oil']),
  M('honey-garlic-meatballs', 'Honey Garlic Meatballs', '🍯', 'Asian', 'beef', 25, 5, ['df', 'nf'],
    ['1 bag frozen meatballs', '1/3 cup honey', '1/4 cup soy sauce', '3 clove garlic', '1 tbsp cornstarch', '2 cup rice', '1 lb broccoli', '1 tbsp sesame seeds']),
  M('lasagna', 'Lasagna', '🍝', 'Italian', 'beef', 75, 5, ['nf'],
    ['12 lasagna noodles', '1 lb ground beef', '24 oz marinara sauce', '15 oz ricotta', '3 cup shredded mozzarella', '1/2 cup parmesan', '1 egg', '1 onion'],
    'Make two and freeze one.'),
  M('falafel-pitas', 'Falafel Pitas', '🧆', 'Mediterranean', 'beans', 30, 2, ['veg', 'vegan', 'df', 'nf'],
    ['1 box falafel mix', '6 pita', '1 cucumber', '2 tomato', '1 cup hummus', '1 head lettuce', '1 lemon']),
  M('quinoa-bowls', 'Quinoa Power Bowls', '🥗', 'American', 'beans', 30, 2, ['veg', 'vegan', 'gf', 'df', 'nf'],
    ['1.5 cup quinoa', '1 can chickpeas', '1 sweet potato', '1 bag kale', '1 avocado', '1/4 cup tahini', '1 lemon', '2 tbsp olive oil']),
  M('sausage-peppers', 'Sausage & Peppers', '🌭', 'Italian', 'sausage', 30, 3, ['df', 'nf'],
    ['1.5 lb italian sausage', '3 bell pepper', '1 onion', '2 clove garlic', '1 can crushed tomatoes', '4 sub rolls', '1 tsp italian seasoning']),
  M('cobb-salad', 'Cobb Salad', '🥗', 'American', 'chicken', 25, 2, ['gf', 'nf'],
    ['1 lb chicken breast', '1 head romaine lettuce', '4 egg', '6 slice bacon', '1 avocado', '1 pint cherry tomatoes', '1/2 cup blue cheese', '1/2 cup ranch dressing']),
  M('pierogi-kielbasa', 'Pierogi & Kielbasa', '🥟', 'Comfort', 'sausage', 20, 4, ['nf'],
    ['1 bag frozen pierogi', '1 lb kielbasa', '1 onion', '3 tbsp butter', '1/2 cup sour cream', '1 lb green beans']),
  M('tortellini-soup', 'Tortellini Soup', '🍲', 'Italian', 'cheese', 30, 4, ['veg', 'nf'],
    ['1 pkg cheese tortellini', '6 cup vegetable broth', '1 can diced tomatoes', '1 bag spinach', '1 onion', '2 clove garlic', '1/2 cup parmesan', '1 tsp italian seasoning']),
];

const S = (id, name, emoji, time, kid, ok, ing) => ({ id, name, emoji, time, kid, ok, serves: 4, ing });

export const SEED_SIDES = [
  S('garlic-bread', 'Garlic Bread', '🥖', 15, 5, ['veg', 'nf'], ['1 baguette', '3 tbsp butter', '2 clove garlic', '1 bunch parsley']),
  S('roasted-broccoli', 'Roasted Broccoli', '🥦', 20, 3, ['veg', 'vegan', 'gf', 'df', 'nf'], ['1 lb broccoli', '2 tbsp olive oil', '1 tsp garlic powder']),
  S('caesar-salad', 'Caesar Salad', '🥗', 10, 3, ['veg', 'nf'], ['1 head romaine lettuce', '1/2 cup caesar dressing', '1/4 cup parmesan', '1 cup croutons']),
  S('mashed-potatoes', 'Mashed Potatoes', '🥔', 25, 5, ['veg', 'gf', 'nf'], ['2 lb potatoes', '4 tbsp butter', '1/2 cup milk']),
  S('steamed-rice', 'Steamed Rice', '🍚', 20, 5, ['veg', 'vegan', 'gf', 'df', 'nf'], ['2 cup rice']),
  S('corn-cob', 'Corn on the Cob', '🌽', 15, 5, ['veg', 'gf', 'nf'], ['4 ear corn', '2 tbsp butter']),
  S('garden-salad', 'Garden Salad', '🥗', 10, 3, ['veg', 'vegan', 'gf', 'df', 'nf'], ['1 bag salad mix', '1 cucumber', '1 pint cherry tomatoes', '1/4 cup salad dressing']),
  S('roasted-carrots', 'Honey Roasted Carrots', '🥕', 25, 4, ['veg', 'gf', 'df', 'nf'], ['1 lb carrot', '1 tbsp honey', '1 tbsp olive oil']),
  S('sweet-potato-fries', 'Sweet Potato Fries', '🍠', 25, 5, ['veg', 'vegan', 'gf', 'df', 'nf'], ['2 sweet potato', '2 tbsp olive oil', '1 tsp paprika']),
  S('green-beans', 'Garlicky Green Beans', '🫛', 15, 3, ['veg', 'vegan', 'gf', 'df', 'nf'], ['1 lb green beans', '2 clove garlic', '1 tbsp olive oil']),
  S('cucumber-salad', 'Cucumber Salad', '🥒', 10, 4, ['veg', 'vegan', 'gf', 'df', 'nf'], ['2 cucumber', '2 tbsp rice vinegar', '1 tsp sugar']),
  S('fruit-salad', 'Fruit Salad', '🍓', 10, 5, ['veg', 'vegan', 'gf', 'df', 'nf'], ['1 cup berries', '2 banana', '1 cup grapes', '2 apple']),
  S('apple-slices', 'Apple Slices', '🍎', 5, 5, ['veg', 'vegan', 'gf', 'df', 'nf'], ['3 apple']),
  S('dinner-rolls', 'Dinner Rolls', '🥐', 10, 5, ['veg', 'nf'], ['1 pkg dinner rolls', '2 tbsp butter']),
  S('coleslaw', 'Coleslaw', '🥬', 10, 3, ['veg', 'gf', 'nf'], ['1 bag coleslaw mix', '1/4 cup mayo', '1 tbsp apple cider vinegar', '1 tsp sugar']),
  S('edamame', 'Edamame', '🫛', 5, 4, ['veg', 'vegan', 'gf', 'df', 'nf'], ['1 bag frozen edamame']),
  S('cornbread', 'Cornbread', '🌽', 25, 5, ['veg', 'nf'], ['1 box cornbread mix', '1 egg', '1/3 cup milk']),
  S('cheesy-cauliflower', 'Cheesy Cauliflower', '🧀', 25, 3, ['veg', 'gf', 'nf'], ['1 head cauliflower', '1 cup shredded cheddar', '2 tbsp butter']),
];

// Build-a-Plate components for picky eaters. Each kid picks the ones they like.
export const PLATE_GROUPS = [
  { id: 'protein', label: 'Protein', emoji: '💪', items: [
    ['🍗', 'Chicken nuggets'], ['🥚', 'Scrambled eggs'], ['🧀', 'Cheese cubes'], ['🌭', 'Hot dog'], ['🫘', 'Beans'],
    ['🐟', 'Fish sticks'], ['🥩', 'Meatballs'], ['🦃', 'Turkey slices'], ['🥜', 'Peanut butter'], ['🍤', 'Shrimp'],
    ['🫓', 'Cheese quesadilla'], ['🥓', 'Bacon'], ['🍖', 'Chicken drumstick'], ['🧈', 'Tofu bites'],
  ] },
  { id: 'carb', label: 'Carb', emoji: '🍞', items: [
    ['🍚', 'Rice'], ['🍝', 'Buttered noodles'], ['🍞', 'Toast'], ['🍟', 'Fries'], ['🥯', 'Bagel'], ['🫓', 'Tortilla'],
    ['🥨', 'Pretzels'], ['🌽', 'Corn'], ['🥐', 'Roll'], ['🥞', 'Mini pancakes'], ['🥔', 'Mashed potatoes'], ['🧇', 'Waffle'],
  ] },
  { id: 'veg', label: 'Fruit & Veg', emoji: '🥕', items: [
    ['🥕', 'Carrot sticks'], ['🥒', 'Cucumber'], ['🍎', 'Apple slices'], ['🍌', 'Banana'], ['🍓', 'Strawberries'],
    ['🫐', 'Blueberries'], ['🍇', 'Grapes'], ['🥦', 'Broccoli trees'], ['🫛', 'Peas'], ['🍅', 'Cherry tomatoes'],
    ['🍊', 'Orange wedges'], ['🥑', 'Avocado'], ['🍉', 'Watermelon'], ['🌽', 'Corn'],
  ] },
  { id: 'dip', label: 'Dip', emoji: '🥣', items: [
    ['🥣', 'Ranch'], ['🍅', 'Ketchup'], ['🫙', 'Hummus'], ['🥛', 'Yogurt dip'], ['🧈', 'Butter'], ['🍯', 'Honey'], ['🫒', 'Olive oil'], ['🧀', 'Cheese sauce'],
  ] },
];

export const DEFAULT_MEMBERS = [
  { name: 'Grown-up 1', emoji: '🧑', kid: false, appetite: 1 },
  { name: 'Grown-up 2', emoji: '👩', kid: false, appetite: 1 },
  { name: 'Kiddo', emoji: '🧒', kid: true, appetite: 0.6 },
];

export const AVATARS = ['🧑', '👩', '👨', '🧒', '👧', '👦', '👶', '🧓', '👵', '👴', '🧑‍🦱', '👩‍🦰', '👨‍🦲', '🧑‍🦳', '🐶', '🐱', '🦄', '🐸', '🦖', '🐼', '🦊', '🐨', '🤖', '👽', '🥷', '🧙', '🧚', '🦸', '🧜', '🤠'];

export const WILDCARDS = {
  'w:takeout': { id: 'w:takeout', name: 'Takeout Night', emoji: '🍕', wild: true, blurb: 'Order in. No dishes!' },
  'w:leftovers': { id: 'w:leftovers', name: 'Leftovers Night', emoji: '♻️', wild: true, blurb: 'Clean out the fridge.' },
  'w:kids': { id: 'w:kids', name: "Kids' Choice", emoji: '👑', wild: true, blurb: 'The kids pick (within reason).' },
  'w:eatout': { id: 'w:eatout', name: 'Eat Out', emoji: '🍽️', wild: true, blurb: 'Treat yourselves to a restaurant.' },
};
