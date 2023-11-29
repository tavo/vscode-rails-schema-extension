import * as vscode from "vscode";
import SchemaNode from "./SchemaNode";

import { getSchemaUri } from "./fileUtils";

export default class SchemaModel {
  data: SchemaNode[];
  callback: Function;

  constructor(callback: Function) {
    this.data = [];
    this.callback = callback;
    this.getRailsSchema();
  }

  public refreshSchema(): void {
    this.getRailsSchema();
  }

  public getRailsSchema(): void {
    const uri = getSchemaUri();
    if (uri === undefined) {
      return;
    }

    vscode.workspace.openTextDocument(uri).then(
      (document) => {
        const schemaText = document.getText();

        const tablesRegex = /create_table([\s\S]*?)(  end)/g;
        const tableNameRegex = /(?<=create_table ")([\s\S]*?)(?=("))/g;
        const tableDefinitionRegex = /(?=create_table )([\s\S]*?)(do)/g;
        const commentsInfoRegex = /(?=comment: )([\s\S]*?)(?=(" do)|(",))/;

        const tablesRegexMatch = schemaText.match(tablesRegex);
        if (tablesRegexMatch === null || tablesRegexMatch.length === 0) {
          return;
        }

        const schemaNodes = tablesRegexMatch.map((tableText) => {
          const tableLableMatch = tableText.match(tableNameRegex);
          const tableDefinitionMatch = tableText.match(tableDefinitionRegex);
          const commentsInfo = tableDefinitionMatch ? tableDefinitionMatch[0].match(commentsInfoRegex) : "";
          const children = this.getTableFields(tableText);
          const label = tableLableMatch ? tableLableMatch[0] : "";
          const tooltip = commentsInfo ? `${commentsInfo[0]}"` : "";
          return {
            label: label,
            tooltip: tooltip,
            isTable: true,
            children: children,
            parent: undefined,
          };
        });

        this.data = schemaNodes;
        this.callback();
      },
      (_err) =>
        vscode.window.showInformationMessage(
          "Cannot find db/schema.rb file in the workspace"
        )
    );
  }

  private getTableFields(tableText: string): SchemaNode[] {
    const fieldsRegex = /(?= t\.(?!index))([\s\S]*?)(?=\n)/g;
    const fieldLabelRegex = /(?<=")([\s\S]*?)(?=("))/g;
    const typeLabelRegex = /(?<=t\.)([\s\S]*?)(?=( ))/g;
    const extraInfoRegex = /(?<=,)([\s\S]*?)(?=(, comment))/g;
    const commentsInfoRegex = /(?=comment: )([\s\S]*?)*("|')/;
    const fields = tableText.match(fieldsRegex) || [];

    return fields.map((fieldText) => {
      const fieldMatch = fieldText.match(fieldLabelRegex);
      const typeMatch = fieldText.match(typeLabelRegex);
      const extraInfo = fieldText.match(extraInfoRegex);
      const commentsInfo = fieldText.match(commentsInfoRegex);
      const label =
        fieldMatch && typeMatch ? `${fieldMatch[0]}: ${typeMatch[0]}` : "";
      const description = extraInfo ? extraInfo[0] : "";
      const tooltip = commentsInfo ? commentsInfo[0] : "";

      return {
        label: label,
        description: description,
        tooltip: tooltip,
        isTable: false,
        children: [],
        parent: undefined,
      };
    });
  }
}
