const toolDataBySection = {
  cliTools: [
    { name: 'Ghosty', description: 'CLI tool', icon: '/icons/ghosty.svg' },
    { name: 'Warp', description: 'CLI tool', icon: '/icons/warp.svg' },
    { name: 'fzf', description: 'Fuzzy finder, especially for history search.', icon: '/icons/bash.svg' },
    { name: 'fzurl', description: 'Custom quick fuzzy URL opener. See [fzurl](https://github.com/DriesMeerman/utils).', icon: '/icons/bash.svg' },
    { name: 'git', description: 'Version control system', icon: '/icons/git.svg' },
    { name: 'lazygit', description: 'A simple terminal UI for git commands.', icon: '/icons/git.svg' },
    { name: 'pbcopy', description: 'macOS command-line utility to copy to clipboard.', icon: '/icons/bash.svg' },
    { name: 'pbpaste', description: 'macOS command-line utility to paste from clipboard.', icon: '/icons/bash.svg' },
    { name: 'ripgrep', description: 'Recursively searches directories for a regex pattern.', icon: '/icons/bash.svg' },
    { name: 'Bat', description: 'A cat(1) clone with syntax highlighting and Git integration.', icon: '/icons/bash.svg' },
    { name: 'ffmpeg', description: 'A complete, cross-platform solution to record, convert and stream audio and video.', icon: '/icons/bash.svg' },
    { name: 'rclone', description: 'Command-line program to manage files on cloud storage.', icon: '/icons/bash.svg' },
    { name: 'ssh', description: 'Secure Shell for remote login and other secure network services.', icon: '/icons/bash.svg' },
    { name: 'homebrew', description: 'The Missing Package Manager for macOS (or Linux).', icon: '/icons/bash.svg' },
    { name: 'curl', description: 'Command-line tool for transferring data with URLs.', icon: '/icons/bash.svg' },
    { name: 'wget', description: 'Network utility to retrieve files from the Web.', icon: '/icons/bash.svg' },
    { name: 'awk', description: 'Pattern scanning and processing language.', icon: '/icons/bash.svg' },
    { name: 'sed', description: 'Stream editor for performing basic text transformations.', icon: '/icons/bash.svg' },
    { name: 'tail', description: 'Outputs the last part of files.', icon: '/icons/bash.svg' },
    { name: 'CRON', description: 'Time-based job scheduler in Unix-like computer operating systems.', icon: '/icons/bash.svg' },
    { name: 'tree', description: 'Displays directory paths and files in a tree-like format.', icon: '/icons/bash.svg' },
    { name: 'df', description: 'Reports file system disk space usage.', icon: '/icons/bash.svg' },
    { name: 'docker', description: 'Platform for developing, shipping, and running applications in containers.', icon: '/icons/docker.svg' },
    { name: 'mv', description: 'Move or rename files and directories.', icon: '/icons/bash.svg' },
    { name: 'cp', description: 'Copy files and directories.', icon: '/icons/bash.svg' },
    { name: 'chmod', description: 'Change file mode bits (permissions).', icon: '/icons/bash.svg' },
    { name: 'Python HTTP Server', description: 'Serve current directory: `python -m http.server 8000`.', icon: '/icons/bash.svg' },
    { name: 'Find Local IP', description: 'e.g., `ifconfig -a | grep inet` (macOS) or `ip addr | grep inet` (Linux).', icon: '/icons/bash.svg' },
    { name: 'entr', description: 'Run arbitrary commands when files change. See [entr](https://github.com/eradman/entr/).', icon: '/icons/bash.svg' },
    { name: 'yazi', description: 'A terminal file manager. Install with `brew install yazi ffmpeg sevenzip jq poppler fd ripgrep fzf zoxide resvg imagemagick font-symbols-only-nerd-font`.', icon: '/icons/bash.svg' },
  ],
  macosSpecific: [
    { name: 'Raycast', description: 'Launcher with file search, app search, emoji, calculator, custom shortcuts, and more.', icon: '/icons/bash.svg' },
    { name: 'Preview', description: 'macOS built-in application for viewing images and PDFs.', icon: '/icons/bash.svg' },
    { name: 'Screenshot: Region to Clipboard', shortcut: 'Cmd+Ctrl+Shift+3', description: 'Captures a selected region to the clipboard.', icon: '/icons/bash.svg' },
    { name: 'Screenshot: Fullscreen to Clipboard', shortcut: 'Cmd+Ctrl+Shift+4', description: 'Captures the entire screen to the clipboard.', icon: '/icons/bash.svg' },
    { name: 'Screenshot: Region to File', shortcut: 'Cmd+Shift+3', description: 'Captures a selected region to a file.', icon: '/icons/bash.svg' },
    { name: 'Screenshot: Fullscreen to File', shortcut: 'Cmd+Shift+4', description: 'Captures the entire screen to a file.', icon: '/icons/bash.svg' },
    { name: 'Screen Capture Controls', shortcut: 'Cmd+Shift+5', description: 'Opens macOS screen capture options, including screen recording.', icon: '/icons/bash.svg' },
  ],
  editorsAndIDEs: [
    { name: 'Cursor', description: 'AI-powered code editor.', icon: '/icons/cursor.svg' },
    { name: 'JetBrains IDEs', description: 'Suite of IDEs for various languages (e.g., IntelliJ IDEA, PyCharm, WebStorm).', icon: '/icons/bash.svg' },
    { name: 'VSCode', description: 'Visual Studio Code, a popular free source code editor.', icon: '/icons/bash.svg' },
    { name: 'neovim', description: 'Hyperextensible Vim-based text editor, often used in the terminal.', icon: '/icons/neovim.svg' },
    { name: 'Obsidian', description: 'A powerful knowledge base and note-taking application.', icon: '/icons/obsidian.svg' },
  ],
  developmentUtilities: [
    { name: 'Bruno', description: 'API client for exploring and testing APIs (similar to Postman).', icon: '/icons/bash.svg' },
  ],
  developmentConcepts: [
    { name: 'Password Manager', description: 'Essential tool for securely storing and managing passwords. Examples: 1Password, Bitwarden, KeePass, etc.', icon: '/icons/bash.svg' },
  ],
};

export const tools = toolDataBySection.cliTools
                        .concat(toolDataBySection.macosSpecific)
                        .concat(toolDataBySection.editorsAndIDEs)
                        .concat(toolDataBySection.developmentUtilities)
                        .concat(toolDataBySection.developmentConcepts)
                        .sort((a, b) => a.name.localeCompare(b.name));