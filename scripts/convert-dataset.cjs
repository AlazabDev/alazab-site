const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const datasetDir = '/var/www/core/alazab.com/dataset';
const yamlPath = path.join(datasetDir, 'dataset.yaml');
const jsonlPath = path.join(datasetDir, 'dataset.jsonl');

try {
  // Read YAML
  const fileContents = fs.readFileSync(yamlPath, 'utf8');
  const data = yaml.load(fileContents);

  // If there are test_cases, we can convert each to a JSONL line.
  // We can also just put the whole document as a single line, 
  // but usually a dataset JSONL has an array of objects.
  let items = [];
  if (data.test_cases && Array.isArray(data.test_cases)) {
      items = data.test_cases;
  } else {
      // If no array found, just wrap the whole object
      items = [data];
  }

  // Write JSONL
  const jsonlData = items.map(item => JSON.stringify(item)).join('\n');
  fs.writeFileSync(jsonlPath, jsonlData, 'utf8');
  
  console.log('Successfully converted dataset.yaml to dataset.jsonl');
} catch (e) {
  console.error('Error converting YAML to JSONL:', e);
}
