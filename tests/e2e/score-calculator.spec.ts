import { expect, test } from '@playwright/test';

const visibleText = (text: string) => `*:has-text("${text}"):visible`;
const visibleParagraph = (text: string) => `p:has-text("${text}"):visible`;

const incrementStepper = async (stepper: any, times: number) => {
  for (let i = 0; i < times; i += 1) {
    await stepper.getByRole('button').last().click();
  }
};

const switchToManualMode = async (page: any) => {
  await page.getByTestId('mode-tab-manual').click();
};

test.describe('mahjong score calculator', () => {
  test('calculates yaku mode score from selected roles', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('yaku-riichi').click();

    await expect(page.locator(visibleParagraph('2翻 30符'))).toBeVisible();
    await expect(page.locator(visibleText('ツモ支払い')).first()).toBeVisible();
    await expect(page.locator(visibleText('1,000点')).first()).toBeVisible();
    await expect(page.locator(visibleText('500点')).first()).toBeVisible();
  });

  test('calculates open-hand kuisagari in yaku mode', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /鳴きなし|門前/ }).click();
    await page.getByTestId('yaku-honitsu').click();

    await expect(page.locator(visibleParagraph('2翻 30符'))).toBeVisible();
    await expect(page.locator(visibleText('2,000')).first()).toBeVisible();
  });

  test('shows yakuman total for daisangen in yaku mode', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'ロン' }).first().click();
    await page.getByTestId('yaku-haku').click();
    await page.getByTestId('yaku-hatsu').click();
    await page.getByTestId('yaku-chun').click();

    await expect(page.locator(visibleText('大三元')).first()).toBeVisible();
    await expect(page.locator(visibleText('32,000')).first()).toBeVisible();
  });

  test('updates manual mode score from fu assistant inputs', async ({ page }) => {
    await page.goto('/');

    await switchToManualMode(page);
    await page.getByRole('button', { name: 'ロン' }).first().click();
    await page.getByTestId('manual-han-stepper').getByRole('button').last().click();

    await page.getByRole('button', { name: 'カンチャン' }).click();
    await expect(page.getByText('上段の符へ 40符 を反映しています。')).toBeVisible();
    await expect(page.locator(visibleParagraph('1翻 40符'))).toBeVisible();
    await expect(page.locator(visibleText('1,300')).first()).toBeVisible();

    await page.getByRole('button', { name: '七対子' }).click();
    await expect(page.getByText('上段の符へ 25符 を反映しています。')).toBeVisible();
    await expect(page.locator(visibleParagraph('1翻 25符'))).toBeVisible();
  });

  test('prevents adding more than four melds', async ({ page }) => {
    await page.goto('/');

    await switchToManualMode(page);
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

    await switchToManualMode(page);
    const openTripletField = page.getByTestId('counter-terminalOpenTriplets');
    const openPlus = openTripletField.getByRole('button').last();

    await expect(openPlus).toBeDisabled();

    await page.getByRole('button', { name: '鳴きなし（門前）' }).click();
    await expect(openPlus).toBeEnabled();
    await openPlus.click();
    await expect(openTripletField.getByText('1', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '鳴きあり' }).click();
    await expect(openPlus).toBeDisabled();
    await expect(openTripletField.getByText('0', { exact: true })).toBeVisible();
  });

  test('disables simple fu inputs for chiitoitsu', async ({ page }) => {
    await page.goto('/');

    await switchToManualMode(page);
    await page.getByRole('button', { name: '七対子' }).click();

    const concealedTripletPlus = page
      .getByTestId('counter-terminalConcealedTriplets')
      .getByRole('button')
      .last();
    await expect(concealedTripletPlus).toBeDisabled();
    await expect(page.getByRole('button', { name: '単騎' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '役牌', exact: true })).toBeDisabled();
    await expect(page.getByText('上段の符へ 25符 を反映しています。')).toBeVisible();
  });

  test('locks fu-generating inputs for pinfu', async ({ page }) => {
    await page.goto('/');

    await switchToManualMode(page);
    await page.getByRole('button', { name: '平和' }).click();

    const concealedTripletPlus = page
      .getByTestId('counter-terminalConcealedTriplets')
      .getByRole('button')
      .last();
    await expect(concealedTripletPlus).toBeDisabled();
    await expect(page.getByRole('button', { name: '単騎' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '役牌', exact: true })).toBeDisabled();
  });

  test('disables assistant when han is four or more', async ({ page }) => {
    await page.goto('/');

    await switchToManualMode(page);
    await incrementStepper(page.getByTestId('manual-han-stepper'), 4);

    await expect(
      page.getByText('4翻以上ではこの簡易符入力UIは使えません。通常形の3翻以下で使ってください。'),
    ).toBeVisible();
    const concealedTripletPlus = page
      .getByTestId('counter-terminalConcealedTriplets')
      .getByRole('button')
      .last();
    await expect(concealedTripletPlus).toBeDisabled();
    await expect(page.getByText('4翻以上のため補助入力は停止中です。')).toBeVisible();
  });

  test('calculates parent mangan in manual mode', async ({ page }) => {
    await page.goto('/');

    await switchToManualMode(page);
    await page.getByRole('button', { name: '子', exact: true }).click();
    await incrementStepper(page.getByTestId('manual-han-stepper'), 4);
    await incrementStepper(page.getByTestId('manual-fu-stepper'), 3);

    await expect(page.locator(visibleText('満貫')).first()).toBeVisible();
    await expect(page.locator(visibleText('4,000点')).first()).toBeVisible();
    await expect(page.locator(visibleText('ツモ支払い')).first()).toBeVisible();
  });

  test('applies pinfu fixed fu in manual mode', async ({ page }) => {
    await page.goto('/');

    await switchToManualMode(page);
    await page.getByRole('button', { name: 'ロン' }).first().click();
    await incrementStepper(page.getByTestId('manual-han-stepper'), 2);
    await page.getByRole('button', { name: '平和' }).click();

    await expect(page.getByText('上段の符へ 30符 を反映しています。')).toBeVisible();
    await expect(page.locator(visibleParagraph('2翻 30符'))).toBeVisible();
    await expect(page.locator(visibleText('2,000')).first()).toBeVisible();
  });

  test('keeps manual inputs after mode switching', async ({ page }) => {
    await page.goto('/');

    await switchToManualMode(page);
    await page.getByRole('button', { name: '子', exact: true }).click();
    await incrementStepper(page.getByTestId('manual-han-stepper'), 3);
    await incrementStepper(page.getByTestId('manual-fu-stepper'), 4);

    await page.getByTestId('mode-tab-yaku').click();
    await switchToManualMode(page);

    await expect(page.getByTestId('manual-han-stepper').getByText('3翻')).toBeVisible();
    await expect(page.getByTestId('manual-fu-stepper').getByText('40符')).toBeVisible();
    await expect(page.getByTestId('manual-fu-stepper').getByText('直接入力')).toBeVisible();
  });
});
