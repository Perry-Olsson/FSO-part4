const myMap = new Map();

for (let i = 0; i < 100000000; i++) {
  myMap.set(`${i}`, true);
}
console.log('done');
console.log(myMap.get('9999999'));
