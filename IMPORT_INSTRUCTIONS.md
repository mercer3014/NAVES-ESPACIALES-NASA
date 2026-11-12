# Sanitized game import

Target repository: https://github.com/mercer3014/NAVES-ESPACIALES-NASA.git
This package is an authorized source import, not a deployment. No remote, push, cloud-agent launch or upload was performed by the packaging step.

## Attachments / order

Initial cloud-agent batch (under 44,000,000 bytes):
- 01-source-tests-docs.tar.gz
- 02-models-textures-images-fonts.tar.gz
- 03-audio.tar.gz

Follow-up attachments (also under 44,000,000 bytes together):
- 04-intro-720-mp4.tar.gz
- 05-intro-alternatives-poster.tar.gz

EVERY archive is below 24,000,000 bytes. Read the sidecar ARCHIVES.json for exact sizes, SHA256 and membership; SHA256SUMS authenticates the archives against that delivered manifest. These hashes detect corruption, not an authenticated signature.

Extract ALL FIVE archives into the SAME repository root, not into separate subdirectories. Members already use paths such as src/main.js, public/models/rover.glb and public/video/intro_720.mp4. No wrapper directory is present. Extract only after checking relative member paths and checking that the destination has no conflicting files. Do not delete or overwrite an existing target project without review. Do not commit the archives themselves.

Example, from the target repository root with the archives elsewhere:

```sh
tar -xzf /path/to/01-source-tests-docs.tar.gz
tar -xzf /path/to/02-models-textures-images-fonts.tar.gz
tar -xzf /path/to/03-audio.tar.gz
tar -xzf /path/to/04-intro-720-mp4.tar.gz
tar -xzf /path/to/05-intro-alternatives-poster.tar.gz
```

Do not claim a complete playable import until both follow-up video archives have arrived. Source tests need the models archive. See README.md for npm ci, build/run, verification, audio/WebRTC caveats and hosting configuration. Verify IMPORT_MANIFEST.json's per-file SHA256 and run npm test and npm run test:expeditions. IMPORT_MANIFEST.json excludes its own recursive hash; its bytes are covered by the source archive SHA256.

The original Git repository and running local services were left unchanged. No Git history, private planning, machine QA records, credentials, environment files, generated builds, installed dependencies, screenshots/logs or artist authoring files are included. Public runtime media/models and notices are preserved byte-for-byte. No new project-wide software license is assigned. Existing public attribution names/contact addresses remain intentionally in the legal notices.

Packaging-only differences are recorded in IMPORT_MANIFEST.json. The asset test now compares A7L/EASEP to pinned original-export hashes instead of needing omitted authoring exports. Two test fixture/output paths are generic. Documentation is portable and .gitignore is strengthened. Runtime source is unchanged.

Security scan found no selected-file credential/private-path indicators; see SECURITY_CHECKS.json for scope and limitations. Optional TURN configuration deliberately reaches browser clients: do not provide permanent privileged credentials. Short room codes are not strong authentication. Fresh real microphone, physical device and public HTTPS/WSS verification are still required for a deployed release. No fresh deployment or full browser mission replay is claimed by this packaging task.
