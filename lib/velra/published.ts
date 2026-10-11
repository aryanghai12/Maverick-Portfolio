/**
 * Which captured executions the page shows.
 *
 * The source pack holds everything that was ever run, including the things
 * that make a real terminal history untidy: the same command run twice, the
 * same listing a few minutes apart, a flag mistyped and corrected, a tool
 * check that has nothing to do with Velra, and an older capture whose outputs
 * were never fully supplied. All of it is real, and none of it helps anyone
 * understand the product.
 *
 * So the page publishes each distinct Velra command exactly once, with the
 * most complete real output there is for it, in the order it was run. This
 * list is that selection, and only these executions are written to
 * data/velra/captured.json. Nothing else from the pack reaches the repository
 * or the browser.
 *
 * The rule for choosing between repeats: prefer the run with complete output,
 * and among those the one that shows the command doing its job. `velra doctor`
 * is the run where every check passes, not the one from before anything had
 * been recorded. `velra status` is the run that shows a capsule staged.
 *
 * It lives in its own file, with no imports, because two things need it that
 * must not depend on each other: the script that writes the data, and the
 * module that reads it.
 */
export const PUBLISHED: readonly string[] = [
  // The first install, on Windows.
  'A1', // npm install -g velra
  'A3', // velra --version
  'C', // velra disable
  'D', // velra enable

  // A working session, on Windows, three days later. One continuous run.
  'N2', // velra doctor
  'N3', // velra inspect
  'N4', // velra restore --list --json
  'N5', // velra inspect --session <id>
  'N10', // velra restore --session <id> --dry-run
  'N11', // velra restore --session <id>
  'N12', // velra restore, answered from the picker
  'N13', // velra status
];
