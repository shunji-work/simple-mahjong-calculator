import { expect, test } from '@playwright/test';

const visibleText = (text: string) => `*:has-text("${text}"):visible`;
const visibleParagraph = (text: string) => `p:has-text("${text}"):visible`;

test.describe('mahjong score calculator', () => {
  test('calculates yaku mode score from selected roles', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '立直（リーチ）' }).click();

    await expect(page.locator(visibleParagraph('2翻 30符'))).toBeVisible();
    await expect(page.locator('span:has-text("親："):visible')).toBeVisible();
    await expect(page.locator(visibleText('1,000点')).first()).toBeVisible();
    await expect(page.locator(visibleText('500点')).first()).toBeVisible();
  });

  test('calculates open-hand kuisagari in yaku mode', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '鳴きなし（メンゼン）' }).click();
    await page.getByRole('button', { name: '混一色（ホンイツ）' }).click();

    await expect(page.locator(visibleParagraph('2翻 30符'))).toBeVisible();
    await expect(page.locator(visibleText('2,000')).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '鳴きあり' })).toBeVisible();
  });

  test('shows yakuman total for daisangen in yaku mode', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'ロン' }).first().click();
    await page.getByRole('button', { name: '役牌：白' }).click();
    await page.getByRole('button', { name: '役牌：發' }).click();
    await page.getByRole('button', { name: '役牌：中' }).click();

    await expect(page.locator(visibleText('大三元（役満）')).first()).toBeVisible();
    await expect(page.locator(visibleText('32,000')).first()).toBeVisible();
  });

  test('updates manual mode score from fu assistant inputs', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'マニュアルモード' }).click();
    await page.getByRole('button', { name: 'ロン' }).first().click();

    await page.locator('label').filter({ hasText: '翻数' }).locator('select').selectOption('1');
    await expect(page.locator(visibleParagraph('1翻 30符'))).toBeVisible();
    await expect(page.locator(visibleText('1,000')).first()).toBeVisible();

    await page.locator('label').filter({ hasText: '待ちタイプ' }).locator('select').selectOption('kanchan');
    await expect(page.getByText('上段の符に 40 符を反映済み')).toBeVisible();
    await expect(page.locator(visibleParagraph('1翻 40符'))).toBeVisible();
    await expect(page.locator(visibleText('1,300')).first()).toBeVisible();

    await page.locator('label').filter({ hasText: '例外' }).locator('select').selectOption('chiitoitsu');
    await expect(page.getByText('上段の符に 25 符を反映済み')).toBeVisible();
    await expect(page.locator(visibleParagraph('1翻 25符'))).toBeVisible();
  });

  test('prevents adding more than four melds', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'マニュアルモード' }).click();
    const field = page.getByTestId('counter-terminalConcealedTriplets');
    const plusButton = field.getByRole('button').last();

    for (let i = 0; i < 4; i += 1) {
      await plusButton.click();
    }

    await expect(plusButton).toBeDisabled();
    await expect(page.getByText('現在の面子数: 4 / 4')).toBeVisible();
  });

  test('disables open meld inputs in menzen state', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'マニュアルモード' }).click();
    const openTripletField = page.getByTestId('counter-terminalOpenTriplets');
    const openPlus = openTripletField.getByRole('button').last();

    await expect(openPlus).toBeDisabled();

    await page.getByRole('button', { name: '鳴きなし（メンゼン）' }).click();
    await expect(openPlus).toBeEnabled();
    await openPlus.click();
    await expect(openTripletField.locator('div.text-2xl', { hasText: '1' })).toBeVisible();
    await page.getByRole('button', { name: '鳴きあり' }).click();
    await expect(openPlus).toBeDisabled();
    await expect(openTripletField.locator('div.text-2xl', { hasText: '0' })).toBeVisible();
  });

  test('disables simple fu inputs for chiitoitsu', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'マニュアルモード' }).click();
    await page.locator('label').filter({ hasText: '例外' }).locator('select').selectOption('chiitoitsu');

    const concealedTripletPlus = page
      .getByTestId('counter-terminalConcealedTriplets')
      .getByRole('button')
      .last();
    await expect(concealedTripletPlus).toBeDisabled();
    await expect(page.locator('label').filter({ hasText: '待ちタイプ' }).locator('select')).toBeDisabled();
    await expect(page.getByRole('button', { name: '役牌', exact: true })).toBeDisabled();
    await expect(page.getByText('上段の符に 25 符を反映済み')).toBeVisible();
  });

  test('locks fu-generating inputs for pinfu', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'マニュアルモード' }).click();
    await page.locator('label').filter({ hasText: '例外' }).locator('select').selectOption('pinfu');

    const concealedTripletPlus = page
      .getByTestId('counter-terminalConcealedTriplets')
      .getByRole('button')
      .last();
    await expect(concealedTripletPlus).toBeDisabled();
    await expect(page.locator('label').filter({ hasText: '待ちタイプ' }).locator('select')).toBeDisabled();
    await expect(page.getByRole('button', { name: '役牌', exact: true })).toBeDisabled();
  });

  test('disables assistant when han is four or more', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'マニュアルモード' }).click();
    await page.locator('label').filter({ hasText: '翻数' }).locator('select').selectOption('4');

    await expect(page.getByText('4翻以上ではこの簡易符入力UIは使えません。通常手の3翻以下専用です。')).toBeVisible();
    const concealedTripletPlus = page
      .getByTestId('counter-terminalConcealedTriplets')
      .getByRole('button')
      .last();
    await expect(concealedTripletPlus).toBeDisabled();
    await expect(page.getByText('4翻以上のため簡易符入力は停止中')).toBeVisible();
  });

  test('calculates parent mangan in manual mode', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'マニュアルモード' }).click();
    await page.getByRole('button', { name: '子' }).click();
    await page.locator('label').filter({ hasText: '翻数' }).locator('select').selectOption('4');
    await page.locator('label').filter({ hasText: '符' }).first().locator('select').selectOption('30');

    await expect(page.locator(visibleText('満貫')).first()).toBeVisible();
    await expect(page.locator(visibleText('4,000点')).first()).toBeVisible();
    await expect(page.locator(visibleText('合計獲得：')).first()).toBeVisible();
  });

  test('applies pinfu fixed fu in manual mode', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'マニュアルモード' }).click();
    await page.getByRole('button', { name: 'ロン' }).first().click();
    await page.locator('label').filter({ hasText: '翻数' }).locator('select').selectOption('2');
    await page.locator('label').filter({ hasText: '例外' }).locator('select').selectOption('pinfu');

    await expect(page.getByText('上段の符に 30 符を反映済み')).toBeVisible();
    await expect(page.locator(visibleParagraph('2翻 30符'))).toBeVisible();
    await expect(page.locator(visibleText('2,000')).first()).toBeVisible();
  });

  test('keeps manual inputs after mode switching', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'マニュアルモード' }).click();
    await page.getByRole('button', { name: '子' }).click();
    await page.locator('label').filter({ hasText: '翻数' }).locator('select').selectOption('3');
    await page.locator('label').filter({ hasText: '符' }).first().locator('select').selectOption('40');

    await page.getByRole('button', { name: '役選択モード' }).click();
    await page.getByRole('button', { name: 'マニュアルモード' }).click();

    await expect(page.locator(visibleText('親 / 門前')).first()).toBeVisible();
    await expect(page.locator(visibleText('3翻')).first()).toBeVisible();
    await expect(page.locator(visibleText('40符 （手動）')).first()).toBeVisible();
  });
});
