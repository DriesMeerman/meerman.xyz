const toolDataBySection = {
  largerCliTools: [
    { name: 'Ghosty', description: 'CLI tool', icon: '/icons/ghosty.svg' },
    { name: 'Warp', description: 'CLI tool', icon: '/icons/warp.svg' },
    { name: 'git', description: 'Version control system', icon: '/icons/git.svg' },
    { name: 'ffmpeg', description: 'A complete, cross-platform solution to record, convert and stream audio and video.', icon: '/icons/bash.svg' },
    // { name: 'rclone', description: 'Command-line program to manage files on cloud storage.', icon: '/icons/bash.svg' },
    { name: 'homebrew', description: 'The Missing Package Manager for macOS (or Linux).', icon: '/icons/homebrew.svg' },
    { name: 'docker', description: 'Platform for developing, shipping, and running applications in containers.', icon: '/icons/docker.svg' },
    { name: 'yazi', description: 'A terminal file manager. Install with `brew install yazi ffmpeg sevenzip jq poppler fd ripgrep fzf zoxide resvg imagemagick font-symbols-only-nerd-font`.', icon: '/icons/bash.svg' },
  ],
  unixUtilities: [
    { name: 'fzf', url: 'https://github.com/junegunn/fzf', description: 'Fuzzy finder, really nice for finding files and it has a great shell integration, for searching history.', icon: '/icons/bash.svg' },
    { name: 'fzurl', url: 'https://github.com/DriesMeerman/utils', description: 'Custom quick fuzzy URL opener based on fzf.', icon: '/icons/bash.svg' },
    { name: 'pbcopy', description: 'macOS command-line utility to copy to clipboard.', icon: '/icons/bash.svg' },
    { name: 'pbpaste', description: 'macOS command-line utility to paste from clipboard.', icon: '/icons/bash.svg' },
    { name: 'ripgrep', url: 'https://github.com/BurntSushi/ripgrep', description: 'Recursively searches directories for a regex pattern.', icon: '/icons/bash.svg' },
    { name: 'bat', url: 'https://github.com/sharkdp/bat', description: 'A cat(1) clone with syntax highlighting and Git integration.', icon: '/icons/bash.svg' },
    { name: 'ssh', description: 'Secure Shell for remote login and other secure network services.', icon: '/icons/bash.svg' },
    { name: 'curl', url: 'https://curl.se/', description: 'Command-line tool for transferring data with URLs.', icon: '/icons/bash.svg' },
    { name: 'wget', url: 'https://www.gnu.org/software/wget/', description: 'Network utility to retrieve files from the Web.', icon: '/icons/bash.svg' },
    { name: 'awk', url: 'https://www.gnu.org/software/gawk/', description: 'Pattern scanning and processing language.', icon: '/icons/bash.svg' },
    { name: 'sed', url: 'https://www.gnu.org/software/sed/', description: 'Stream editor for performing basic text transformations.', icon: '/icons/bash.svg' },
    { name: 'tail', url: 'https://www.gnu.org/software/coreutils/manual/html_node/tail-invocation.html', description: 'Outputs the last part of files.', icon: '/icons/bash.svg' },
    { name: 'CRON', url: 'https://en.wikipedia.org/wiki/Cron', description: 'Time-based job scheduler in Unix-like computer operating systems.', icon: '/icons/bash.svg' },
    { name: 'tree', url: 'https://mama.indstate.edu/users/ice/tree/', description: 'Displays directory paths and files in a tree-like format.', icon: '/icons/bash.svg' },
    { name: 'df', url: 'https://www.gnu.org/software/coreutils/manual/html_node/df-invocation.html', description: 'Reports file system disk space usage.', icon: '/icons/bash.svg' },
    { name: 'mv', url: 'https://www.gnu.org/software/coreutils/manual/html_node/mv-invocation.html', description: 'Move or rename files and directories.', icon: '/icons/bash.svg' },
    { name: 'cp', url: 'https://www.gnu.org/software/coreutils/manual/html_node/cp-invocation.html', description: 'Copy files and directories.', icon: '/icons/bash.svg' },
    { name: 'chmod', url: 'https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html', description: 'Change file mode bits (permissions).', icon: '/icons/bash.svg' },
    { name: 'python -m http.server 8000', description: 'Built in python webserver to serve current directory.', icon: '/icons/bash.svg' },
    { name: 'ifconfig -a | grep inet', description: 'Find local IP address on MacOS. For Linux`ifconfig -a | grep inet` (macOS) or `ip addr | grep inet` (Linux).', icon: '/icons/bash.svg' },
    { name: 'entr', url: 'https://github.com/eradman/entr/', description: 'Run arbitrary commands when files change.', icon: '/icons/bash.svg' },
    { name: 'lazygit', url: 'https://github.com/jesseduffield/lazygit', description: 'A simple terminal UI for git commands.', icon: '/icons/git.svg' },
  ],
  macosSpecific: [
    { name: 'Preview', description: 'macOS built-in application for viewing images and PDFs.', icon: '/icons/bash.svg' },
    { name: 'Screenshot: Region to Clipboard', shortcut: 'Cmd+Ctrl+Shift+3', description: 'Captures a selected region to the clipboard.', icon: '/icons/bash.svg' },
    { name: 'Screenshot: Fullscreen to Clipboard', shortcut: 'Cmd+Ctrl+Shift+4', description: 'Captures the entire screen to the clipboard.', icon: '/icons/bash.svg' },
    { name: 'Screenshot: Region to File', shortcut: 'Cmd+Shift+3', description: 'Captures a selected region to a file.', icon: '/icons/bash.svg' },
    { name: 'Screenshot: Fullscreen to File', shortcut: 'Cmd+Shift+4', description: 'Captures the entire screen to a file.', icon: '/icons/bash.svg' },
    { name: 'Screen Capture Controls', shortcut: 'Cmd+Shift+5', description: 'Opens macOS screen capture options, including screen recording.', icon: '/icons/bash.svg' },
  ],
  devTools: [
    { name: 'Cursor', description: 'AI-powered code editor.', icon: '/icons/cursor.svg' },
    { name: 'JetBrains IDEs', description: 'Suite of IDEs for various languages (e.g., IntelliJ IDEA, PyCharm, WebStorm).', icon: '/icons/intellij.svg' },
    { name: 'VSCode', description: 'Visual Studio Code, a popular free source code editor.', icon: '/icons/vscode.svg' },
    { name: 'neovim', description: 'Hyperextensible Vim-based text editor, often used in the terminal.', icon: '/icons/neovim.svg' },
    { name: 'Obsidian', description: 'A powerful knowledge base and note-taking application.', icon: '/icons/obsidian.svg' },
    { name: 'Xcode', description: 'IDE for macOS development.', icon: '/icons/apple.svg' },
    { name: 'Raycast', description: 'Launcher with file search, app search, emoji, calculator, custom shortcuts, and more.', icon: '/icons/raycast.svg' },
    { name: 'Bruno', description: 'API client for exploring and testing APIs (similar to Postman).', icon: '/icons/swagger.svg' },
  ],
};

export const tools = toolDataBySection.largerCliTools
                        // .concat(toolDataBySection.unixUtilities)
                        // .concat(toolDataBySection.macosSpecific)
                        .concat(toolDataBySection.devTools)
                        // .sort((a, b) => a.name.localeCompare(b.name));


export const software = toolDataBySection.largerCliTools;
export const unixTools = toolDataBySection.unixUtilities;
export const macosSpecific = toolDataBySection.macosSpecific;
export const devTools = toolDataBySection.devTools;