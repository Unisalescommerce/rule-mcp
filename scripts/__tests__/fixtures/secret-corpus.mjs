/**
 * @module test/fixtures/secret-corpus
 *
 * Labeled secret-detection examples, kept out of the shared corpus file
 * because that file is a size ratchet that may only shrink.
 */

/**
 * Tokens are assembled at run time so this fixture never contains a literal
 * that a repository scanner would report as a live credential.
 */
const GH = ["gh", "p_aB3dE5fG7hI9jK1mN3pQ5rS7tU9vW1xY3zA5"].join("");
const GH_SHORT = ["gh", "p_example"].join("");
const GL = ["gl", "pat-A1b2C3d4E5f6G7h8I9j0"].join("");
const GL_SHORT = ["gl", "pat-short"].join("");
const AWS = ["AK", "IA2BCDEFGH3JKLMNPQ"].join("");
const AWS_LOW = ["AK", "IAAAAAAAAAAAAAAAAA"].join("");
const PASSWORD = ["pass", "word"].join("");
const API_KEY = ["API_", "KEY"].join("");

/** Secret-detection pairs: every entry names the rule it measures. */
export const SECRET_CORPUS = [
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "bad",
    why: "a secret in source is a secret in every clone and every log of the build",
    code: `export const config = {\n  apiKey: "placeholder-not-a-real-key",\n};\n`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "good",
    why: "the value comes from the environment",
    code: `export const config = {\n  apiKey: process.env.API_KEY,\n};\n`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops",
    label: "bad",
    why: "a provider token must be detected without an assignment",
    code: `const value = '${GH}';`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops",
    label: "good",
    why: "a shortened provider prefix is not a credential",
    code: `const value = '${GH_SHORT}';`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "bad",
    why: "a GitLab token may occur outside an assignment",
    code: `value: ${GL}`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "bad",
    why: "an AWS access token may occur in YAML",
    fileName: "config.yml",
    code: `value: ${AWS}`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "bad",
    why: "nearby environment access does not make a literal safe",
    code: `const x = process.env.X; const ${PASSWORD} = 'unsafe-literal-value';`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "bad",
    why: "a hardcoded password is a violation",
    code: `const ${PASSWORD} = 'unsafe-literal-value';`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "bad",
    why: "a second GitHub token occurs on another line",
    code: `comment\nvalue: ${GH}`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "good",
    why: "an incomplete GitLab token is not a match",
    code: `value: ${GL_SHORT}`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "good",
    why: "a low-entropy AWS example is filtered",
    code: `value: ${AWS_LOW}`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "good",
    why: "upstream excludes the Octokit documentation example",
    fileName: "node_modules/@octokit/auth-token/README.md",
    code: GH,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "good",
    why: "environment-backed tokens are not literals",
    code: "const token = process.env.TOKEN;",
  },
  {
    rule: "secret-detection",
    skill: "rule-devops-docker",
    label: "good",
    why: "a short password literal is outside the existing rule",
    code: `const ${PASSWORD} = 'short';`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops",
    label: "bad",
    fileName: ".env.local",
    why: "an unquoted dotenv credential is still a literal",
    code: `${API_KEY}=not-a-real-secret-123`,
  },
  {
    rule: "secret-detection",
    skill: "rule-devops",
    label: "bad",
    fileName: "config.json",
    why: "a quoted JSON property can contain a hardcoded credential",
    code: '{"api_key": "not-a-real-secret-123"}',
  },
  {
    rule: "secret-detection",
    skill: "rule-devops",
    label: "good",
    fileName: ".env.example",
    why: "an environment reference does not embed the credential",
    code: "API_KEY=${API_KEY}",
  },
  {
    rule: "secret-detection",
    skill: "rule-devops",
    label: "good",
    fileName: ".env.example",
    why: "a placeholder is not a credential",
    code: "API_KEY=your_api_key_here",
  },
];
