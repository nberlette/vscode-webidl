// currently all of our desktop-specific code in the main extension.ts
// module is also compatible with the web extension (which uses web workers),
// so we can get away with simply re-exporting the necessary hooks as-is.

// once we expand the functionality of the extension and implement thw full
// language server protocol, we'll likely need to add some actual logic and
// platform-specific code here.

export { activate, deactivate } from "../extension.ts";
