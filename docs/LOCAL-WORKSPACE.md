# Android local workspace

The Coding Workshop can connect to a user-selected folder through the browser File System Access API.

## One-time setup

1. Open Intelligent AI in a supported Chromium browser on a secure HTTPS origin.
2. Open Coding Workshop and choose "Connect Workspace Folder".
3. In the Android system folder picker, select the already-created `Intelligent AI` folder.
4. Grant read/write access.

The selected directory handle is stored in IndexedDB. Browser permissions can be revoked or require renewed user approval, so reconnect if the app reports that access expired.

## Automatic project layout

The owner only selects the root folder. The app creates project folders and nested directories as needed:

- `Projects/<project-name>-<timestamp>/`
- Any nested paths returned by the AI project manifest (for example `src/components/` or `tests/`).
- A generated `README.md` for each project.

The user does not need to create any subfolders manually. The selected folder is the only location the browser workspace engine can write to.

## Safety and limits

- The browser asks the user to select the root folder and grant write access. The application cannot silently access the rest of phone storage.
- Project paths are relative; absolute paths, traversal segments, duplicate paths, common secret files and private-key extensions are rejected.
- Text output is limited to 40,000 characters per file and 160,000 characters per project in this first version.
- Generated code is written as source files only. This module does not execute code, install packages, run terminal commands or deploy projects.
- Browser support is feature-detected. Chromium-based Chrome on Android supports the directory picker in current releases; browsers without it must use the app's local draft/export fallback.
- The app may need the owner to reconnect after closing all tabs, clearing site data, revoking permission or changing browser profiles.

See the official Chrome documentation for the File System Access API and permission model:
https://developer.chrome.com/docs/capabilities/web-apis/file-system-access
