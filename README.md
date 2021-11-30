# rails-schema

This extension provides a new way to see the DB tables and columns in a Rails project.

## Features

Available command:

```json
[
  {
    "command": "extension.showRailsSchema",
    "title": "Show Rails Schema",
    "key": "ctrl+alt+s",
    "mac": "cmd+ctrl+s"
  }
]
```

- Within a Rails project, use the command `Show Rails Schema` to open a new activitybar panel with all the DB tables in the `db/schema.rb` file.

![Extension Example](https://github.com/tavo/vscode-rails-schema-extension/raw/master/public/rails-schema-command.png)

- If the command is triggered from a Rails Model, it will automatically expand that especific table in the tree view showing the related column's names and types.

![Extension Example](https://github.com/tavo/vscode-rails-schema-extension/raw/master/public/rails-schema-activitybar.png)

- From the list of DB tables on the Rails Schema activitybar, on hover, there's a Open in Schema button that will open the `db/schema.rb` file and center the block related to that specific table.
