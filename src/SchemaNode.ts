import { URI } from "vscode-uri";

export default interface SchemaNode {
  label: string;
  description?: string;
  tooltip?: string;
  resourceUri?: URI;
  isTable: boolean;
  children: SchemaNode[];
  parent: SchemaNode | undefined;
}
