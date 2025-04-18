import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import slackifyMarkdown from 'slackify-markdown';

export class SlackifyMarkdown implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Slackify Markdown',
		name: 'slackifyMarkdown',
		group: ['transform'],
		version: 1,
		icon: { light: 'file:slackify-markdown.svg', dark: 'file:slackify-markdown.dark.svg' },
		description: 'Converts Markdown to Slack-formatted text',
		defaults: {
			name: 'Slackify Markdown',
		},
		// @ts-ignore
		inputs: ['main'],
		// @ts-ignore
		outputs: ['main'],
		properties: [
			{
				displayName: 'Markdown Text',
				name: 'markdownText',
				type: 'string',
				default: '',
				required: true,
				description: 'The markdown text to convert to Slack format',
			},
			{
				displayName: 'Output Field',
				name: 'outputField',
				type: 'string',
				default: 'slackText',
				description: 'The name of the field to store the converted Slack text',
			},
		],
	};

	// The function responsible for converting markdown to Slack format
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get parameters
				const markdownText = this.getNodeParameter('markdownText', itemIndex) as string;
				const outputField = this.getNodeParameter('outputField', itemIndex) as string;

				// Convert markdown to Slack format
				const slackText = slackifyMarkdown(markdownText);

				// Create a shallow copy of the item
				const newItem: INodeExecutionData = {
					json: {
						...items[itemIndex].json,
						[outputField]: slackText,
					},
					pairedItem: itemIndex,
				};

				returnItems.push(newItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnItems.push({
						json: {
							...items[itemIndex].json,
							error: error.message,
						},
						pairedItem: itemIndex,
					});
					continue;
				}

				// If continueOnFail is false, throw the error
				if (error.context) {
					// If the error already has context, just add itemIndex
					error.context.itemIndex = itemIndex;
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error, { itemIndex });
			}
		}

		return [returnItems];
	}
}
