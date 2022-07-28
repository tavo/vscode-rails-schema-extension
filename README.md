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

<img width="1177" alt="Screen Shot 2022-07-28 at 9 55 55 AM" src="https://user-images.githubusercontent.com/963612/181523316-3c01b9d9-e315-49c5-bc84-e783b9a10fc9.png">

- If the command is triggered from a Rails Model, it will automatically expand that especific table in the tree view showing the related column's names and types. On hover, each column will show as a tooltip the related comments, for now, this is only at the column level.

<img width="1183" alt="Screen Shot 2022-07-28 at 9 53 02 AM" src="https://user-images.githubusercontent.com/963612/181523626-0eef9fe7-a8d4-4636-acdb-af6b49a0db94.png">

- From the list of DB tables on the Rails Schema activitybar, on hover, there's a Open in Schema button that will open the `db/schema.rb` file and center the block related to that specific table.
