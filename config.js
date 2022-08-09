module.exports.version = require('./package.json').version;

module.exports.users = [
  { name: "mahmoud", color: "#0984e3" },
  { name: "joseph", color: "#d63031" },
  { name: 'shadi', color: '#00ff68' }
];

module.exports.sortOptions = [
  { name: "default", value: "default" },
  { name: "A-Z", value: "enASC" },
  { name: "Z-A", value: "enDESC" },
  { name: "أ-ي", value: "arASC" },
  { name: "ي-أ", value: "arDESC" },
];

module.exports.categories = [
  { name: "Fruits", value: "fruits" },
  { name: "Verbal", value: "verbal" },
  { name: "Cars", value: "cars" },
  { name: "Others", value: "others" },
];