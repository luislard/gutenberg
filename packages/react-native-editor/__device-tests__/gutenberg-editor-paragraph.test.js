/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import {
	backspace,
	clickMiddleOfElement,
	clickBeginningOfElement,
	isAndroid,
} from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests for Paragraph Block', () => {
	it( 'should be able to split one paragraph block into two', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph
		);
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.shortText
		);
		await clickMiddleOfElement(
			editorPage.driver,
			paragraphBlockElement,
			true
		);
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			'\n',
			false
		);
		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		expect( await editorPage.getNumberOfParagraphBlocks() ).toEqual( 2 );
		expect( text0 ).not.toBe( '' );
		expect( text1 ).not.toBe( '' );
		expect( testData.shortText ).toMatch(
			new RegExp( `${ text0 + text1 }|${ text0 } ${ text1 }` )
		);

		await editorPage.removeBlockAtPosition( blockNames.paragraph, 2 );
		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	it( 'should be able to merge 2 paragraph blocks into 1', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		let paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.shortText
		);
		await clickMiddleOfElement(
			editorPage.driver,
			paragraphBlockElement,
			true
		);
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			'\n'
		);

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		expect( await editorPage.getNumberOfParagraphBlocks() ).toEqual( 2 );
		paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph,
			2
		);

		await clickBeginningOfElement(
			editorPage.driver,
			paragraphBlockElement
		);

		const backspaceKey = isAndroid() ? backspace : '\b\b';
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			backspaceKey
		);

		const text = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect(
			text0.replace( /\s/g, '' ) + text1.replace( /\s/g, '' )
		).toMatch( text.replace( /\s/g, '' ) );
		expect( await editorPage.getNumberOfParagraphBlocks() ).toEqual( 1 );
		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	it( 'should be able to create a post with multiple paragraph blocks', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		await editorPage.sendTextToParagraphBlock( 1, testData.longText );

		for ( let i = 3; i > 0; i-- ) {
			await editorPage.removeBlockAtPosition( blockNames.paragraph, i );
		}
	} );

	it( 'should be able to merge blocks with unknown html elements', async () => {
		await editorPage.setHtmlContent(
			[
				testData.unknownElementParagraphBlock,
				testData.lettersInParagraphBlock,
			].join( '\n\n' )
		);

		// Merge paragraphs.
		const blockText = await editorPage.getTextForParagraphBlockAtPosition(
			2
		);
		const paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph,
			2
		);

		await clickBeginningOfElement(
			editorPage.driver,
			paragraphBlockElement
		);
		const backspaceKey = isAndroid() ? backspace : '\b\b';
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			backspaceKey
		);

		// Verify the editor has not crashed.
		const mergedBlockText = await editorPage.getTextForParagraphBlockAtPosition(
			1
		);
		expect( mergedBlockText.length ).not.toEqual( blockText.length );

		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	// Based on https://github.com/wordpress-mobile/gutenberg-mobile/pull/1507
	it( 'should handle multiline paragraphs from web', async () => {
		await editorPage.setHtmlContent(
			[
				testData.multiLinesParagraphBlock,
				testData.paragraphBlockEmpty,
			].join( '\n\n' )
		);

		// Merge paragraphs.
		const paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph,
			2
		);
		const backspaceKey = isAndroid() ? backspace : '\b\b';
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			backspaceKey
		);

		// Verify the editor has not crashed.
		const text = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text.length ).not.toEqual( 0 );

		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}
		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );
} );
