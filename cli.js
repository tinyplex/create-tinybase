#!/usr/bin/env node

import prompts from "prompts";
import { cp, readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Support non-interactive mode for testing
const args = process.argv.slice(2);
const nonInteractive = args.includes("--non-interactive");

if (!nonInteractive) {
  console.log("🎉 Welcome to TinyBase!\n");
}

const questions = [
  {
    type: "text",
    name: "projectName",
    message: "Project name:",
    initial: "my-tinybase-app",
    validate: (value) => (value.length > 0 ? true : "Project name is required"),
  },
  {
    type: "select",
    name: "language",
    message: "Language:",
    choices: [
      { title: "TypeScript", value: "typescript" },
      { title: "JavaScript", value: "javascript" },
    ],
    initial: 0,
  },
  {
    type: "select",
    name: "framework",
    message: "Framework:",
    choices: [
      { title: "React", value: "react" },
      { title: "Vanilla", value: "vanilla" },
    ],
    initial: 0,
  },
];

// Map answers to template directories
function getTemplateName(language, framework) {
  const templates = {
    "javascript-vanilla": "vite-tinybase",
    "javascript-react": "vite-tinybase-react",
    "typescript-vanilla": "vite-tinybase-ts",
    "typescript-react": "vite-tinybase-ts-react",
  };
  return templates[`${language}-${framework}`];
}

async function main() {
  let answers;

  if (nonInteractive) {
    // Parse command line arguments for testing
    const projectNameIndex = args.indexOf("--project-name");
    const languageIndex = args.indexOf("--language");
    const frameworkIndex = args.indexOf("--framework");

    answers = {
      projectName:
        projectNameIndex !== -1
          ? args[projectNameIndex + 1]
          : "my-tinybase-app",
      language: languageIndex !== -1 ? args[languageIndex + 1] : "typescript",
      framework: frameworkIndex !== -1 ? args[frameworkIndex + 1] : "react",
    };
  } else {
    answers = await prompts(questions, {
      onCancel: () => {
        console.log("\n❌ Cancelled");
        process.exit(0);
      },
    });
  }

  const templateName = getTemplateName(answers.language, answers.framework);

  if (!nonInteractive) {
    console.log(`\n📦 Creating your TinyBase app from ${templateName}...\n`);
  }

  const projectPath = join(process.cwd(), answers.projectName);
  const templatePath = join(__dirname, "..", templateName);

  try {
    await createProject(projectPath, templatePath, answers);

    if (!nonInteractive) {
      console.log("✅ Done!\n");
      console.log(`Next steps:`);
      console.log(`  cd ${answers.projectName}`);
      console.log(`  npm install`);
      console.log(`  npm run dev`);
    }
  } catch (error) {
    console.error("❌ Error creating project:", error.message);
    process.exit(1);
  }
}

async function createProject(projectPath, templatePath, config) {
  // Copy template directory
  await cp(templatePath, projectPath, {
    recursive: true,
    filter: (src) => {
      // Skip node_modules, .git, and lock files
      return (
        !src.includes("node_modules") &&
        !src.includes(".git") &&
        !src.includes("package-lock.json") &&
        !src.includes(".DS_Store")
      );
    },
  });

  // Update package.json with new project name
  const pkgPath = join(projectPath, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  pkg.name = config.projectName;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
