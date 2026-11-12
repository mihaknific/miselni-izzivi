import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

function validateJson(data, schema, fileName) {
  const errors = [];

  function validate(obj, sch, path = '') {
    if (sch.oneOf) {
      let oneOfValid = false;
      for (const subSchema of sch.oneOf) {
        const originalErrors = errors.length;
        validate(obj, subSchema, path);
        if (errors.length === originalErrors) {
          oneOfValid = true;
          break;
        }
        errors.length = originalErrors;
      }
      if (!oneOfValid) {
        errors.push(`${path}: failed oneOf validation`);
      }
      return;
    }

    if (sch.type === 'array') {
      if (!Array.isArray(obj)) {
        errors.push(`${path}: expected array`);
        return;
      }
      if (sch.items) {
        obj.forEach((item, i) => validate(item, sch.items, `${path}[${i}]`));
      }
    } else if (sch.type === 'object') {
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        errors.push(`${path}: expected object`);
        return;
      }
      if (sch.required) {
        for (const req of sch.required) {
          if (!(req in obj)) {
            errors.push(`${path}.${req}: required property missing`);
          }
        }
      }
      if (sch.properties) {
        for (const [key, propSchema] of Object.entries(sch.properties)) {
          if (key in obj) {
            validate(obj[key], propSchema, `${path}.${key}`);
          }
        }
      }
      if (sch.additionalProperties === false) {
        const allowed = Object.keys(sch.properties || {});
        if (sch.required) allowed.push(...sch.required);
        for (const key of Object.keys(obj)) {
          if (!allowed.includes(key)) {
            errors.push(`${path}.${key}: additional property not allowed`);
          }
        }
      }
    } else if (sch.type === 'string') {
      if (typeof obj !== 'string') {
        errors.push(`${path}: expected string`);
      } else {
        if (sch.minLength && obj.length < sch.minLength) {
          errors.push(`${path}: string too short (min ${sch.minLength})`);
        }
        if (sch.pattern) {
          const re = new RegExp(sch.pattern);
          if (!re.test(obj)) {
            errors.push(`${path}: pattern mismatch (${sch.pattern})`);
          }
        }
        if (sch.enum && !sch.enum.includes(obj)) {
          errors.push(`${path}: value not in enum [${sch.enum.join(', ')}]`);
        }
      }
    } else if (sch.type === 'integer') {
      if (!Number.isInteger(obj)) {
        errors.push(`${path}: expected integer`);
      } else {
        if (sch.minimum !== undefined && obj < sch.minimum) {
          errors.push(`${path}: value < ${sch.minimum}`);
        }
      }
    }
  }

  validate(data, schema);
  return errors;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

console.log('Validating JSON files...\n');

const filesToValidate = [
  { data: 'data/tasks.json', schema: 'data/schemas/tasks.schema.json', name: 'tasks.json' },
  { data: 'data/puzzles.json', schema: 'data/schemas/puzzles.schema.json', name: 'puzzles.json' },
  {
    data: 'data/patterns.json',
    schema: 'data/schemas/patterns.schema.json',
    name: 'patterns.json',
  },
];

let hasErrors = false;

for (const { data, schema, name } of filesToValidate) {
  try {
    const dataPath = path.join(rootDir, data);
    const schemaPath = path.join(rootDir, schema);

    const jsonData = loadJson(dataPath);
    const jsonSchema = loadJson(schemaPath);

    const errors = validateJson(jsonData, jsonSchema, name);

    if (errors.length > 0) {
      console.error(`❌ ${name}: ${errors.length} validation error(s)`);
      errors.forEach(e => console.error(`  - ${e}`));
      hasErrors = true;
    } else {
      console.log(`✅ ${name}: OK (${Array.isArray(jsonData) ? jsonData.length : 'object'} items)`);
    }
  } catch (e) {
    console.error(`❌ ${name}: Failed to load/validate - ${e.message}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.log('\n❌ Validation failed');
  process.exit(1);
} else {
  console.log('\n✅ All validations passed');
}
