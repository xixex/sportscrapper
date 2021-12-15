const { Builder, By, Key, until, driver, Actions } = require('selenium-webdriver');
const webdriver = require('selenium-webdriver');
const { parse } = require('node-html-parser');
const chrome = require('selenium-webdriver/chrome');
const htmlparser2 = require("htmlparser2");
const { compareDocumentPosition } = require('htmlparser2/node_modules/domutils');
(async function example() {
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(
            new chrome.Options()
                .headless()
                .addArguments("--log-level=3"))
        .build();

    driver.manage().window().maximize();

    await driver.get('https://www.soccerstand.com/ru/');
    await driver.sleep(500);
    try {
        await driver.findElement(By.id('onetrust-accept-btn-handler')).click();
    } catch {

    }

    await driver.findElement(By.className('header__buttonIcon--settings')).click();
    await driver.sleep(500);
    await driver.findElement(By.xpath('//*[@id="livescore-settings-form"]/div[4]/div[2]/div/label[2]')).click();
    await driver.findElement(By.xpath('//*[@id="lsid-window-close"]')).click();

    let BALANCE = 100;
    const STAKE = 5;
    let GoodMatches = 0;

    const dates = [
        // '08/12',
        // '09/12',
        // '10/12',
        // '11/12',
        // '12/12',
        // '13/12',
        // null,
        // '15/12',
        '16/12',
        // '17/12',
        // '18/12',
        // '19/12',
        // '20/12',
        // '21/12',
    ]

    for (let date of dates) {
        const dateButton = await driver.findElement(By.className('calendar__datepicker'));
        driver.executeScript("arguments[0].scrollIntoView()", dateButton);
        if (date) {
            await dateButton.click();
            await driver.findElement(By.xpath("//div[contains(text(), '" + date + "')]")).click();
        }

        await driver.sleep(2000);
        const matches = await driver.findElements(By.className('event__match--oneLine'));
        console.log(matches.length)



        const checkMatch = async (match) => {
            await match.click();

            let lineInfo = await match.getText();
            const lineInfoArray = lineInfo.split('\n');
            const lineDate = lineInfoArray[0];
            lineInfo = lineInfoArray.join(' ');

            const firstTeamName = lineInfoArray[1];
            const secondTeamName = lineInfoArray[2];
            let dominator = firstTeamName;

            let allWindows = await driver.getAllWindowHandles();

            await driver.switchTo().window(allWindows[1])


            const oddsButton = await driver.findElement(By.xpath("//a[contains(text(), 'Коэффициенты')]")).click();
            const x12oddsElements = await driver.wait(until.elementsLocated(By.className("ui-table__row")), 2000);
            const x12firstOddsElement = x12oddsElements[0];
            const x12firstOddsText = await x12firstOddsElement.getText();
            const x12firstOddsArray = x12firstOddsText.split('\n');
            const teamX12OddFirst = +x12firstOddsArray[0];
            const teamX12OddSecond = +x12firstOddsArray[2];

            if (teamX12OddSecond < teamX12OddFirst) {
                dominator = secondTeamName;
            }

            await driver.wait(until.elementLocated(By.xpath("//a[contains(text(), 'Б/М')]")), 2000).click();
            await driver.wait(until.elementLocated(By.xpath("//div[contains(text(), 'Меньше')]")), 2000);

            const overUnderOddsElements = await driver.wait(until.elementsLocated(By.className("ui-table__row")), 2000);

            let over25Odd = null;

            for (let el of overUnderOddsElements) {
                const text = await el.getText();
                const array = text.split('\n');

                if (array[0] === '2.5') {
                    over25Odd = +array[1];
                    break;
                }
            }


            await driver.findElement(By.xpath("//a[contains(text(), 'H2H')]")).click();
            await driver.wait(until.elementLocated(By.className('h2h__section section')), 2000);

            const allTables = await driver.findElements(By.className('h2h__section section'));
            const h2hTable1 = allTables[0];

            let moreButtons1 = await h2hTable1.findElements(By.className('h2h__showMore showMore'));

            if (moreButtons1.length) {
                await moreButtons1[moreButtons1.length - 1].click();
            }

            const h2hTable2 = allTables[1];

            let moreButtons2 = await h2hTable2.findElements(By.className('h2h__showMore showMore'));

            if (moreButtons2.length) {
                await moreButtons2[moreButtons2.length - 1].click();
            }

            let h2hMatches1 = await h2hTable1.findElements(By.className('h2h__row'));
            let h2hMatches2 = await h2hTable2.findElements(By.className('h2h__row'));


            const slicedMathes = async (table) => {
                let newTable = [...table];
                let lastGameh2hIndex = null;

                let i = 0;
                for (let lastMatch of newTable) {
                    let matchText = await lastMatch.getText();
                    matchText = matchText.split('\n').join(' ');

                    if (matchText.includes(firstTeamName + ' ' + secondTeamName)) {
                        lastGameh2hIndex = i;
                    }

                    i++;
                }

                if (lastGameh2hIndex) {
                    newTable = newTable.slice(lastGameh2hIndex + 1);
                }

                return newTable;
            }

            h2hMatches1 = await slicedMathes(h2hMatches1);
            h2hMatches2 = await slicedMathes(h2hMatches2);

            let scoredFirst = 0;
            let consededFirst = 0;
            let scoredSecond = 0;
            let consededSecond = 0;

            for (let match of h2hMatches1) {
                const matchText = await match.getText();
                const matchArray = matchText.split('\n');
                const matchScoreArray = matchArray[4].split(':');
                const isFirst = matchArray[2] === firstTeamName;

                if (isFirst) {
                    if (+matchScoreArray[0] === 0) {
                        scoredFirst++;
                    }
                    if (+matchScoreArray[1] === 0) {
                        consededFirst++;
                    }
                } else {
                    if (+matchScoreArray[1] === 0) {
                        scoredFirst++;
                    }
                    if (+matchScoreArray[0] === 0) {
                        consededFirst++;
                    }
                }
            }

            for (let match of h2hMatches2) {
                const matchText = await match.getText();
                const matchArray = matchText.split('\n');
                const matchScoreArray = matchArray[4].split(':');
                const isFirst = matchArray[2] === firstTeamName;

                if (isFirst) {
                    if (+matchScoreArray[0] === 0) {
                        scoredSecond++;
                    }
                    if (+matchScoreArray[1] === 0) {
                        consededFirst++;
                    }
                } else {
                    if (+matchScoreArray[1] === 0) {
                        scoredSecond++;
                    }
                    if (+matchScoreArray[0] === 0) {
                        consededSecond++;
                    }
                }
            }

            let firstAvg = null;
            let secondAvg = null;

            if (dominator === firstTeamName) {
                firstAvg = consededFirst / h2hMatches1.length;
                secondAvg = scoredSecond / h2hMatches2.length;
            } else {
                firstAvg = scoredFirst / h2hMatches1.length;
                secondAvg = consededSecond / h2hMatches2.length;
            }

            // проверка кэфов на бэтфэйр

            const absOddsDifference = Math.abs(teamX12OddSecond - teamX12OddFirst);
            if ((firstAvg >= 0.6 || secondAvg >= 0.6)) {
                try {
                    driver.executeScript('document.getElementsByClassName("fixedHeaderDuel fixedHeaderDuel--isVisible")[0]?.remove();');
                } catch {

                }

                const oddsButton1 = await driver.findElement(By.xpath("//a[contains(text(), 'Коэффициенты')]"));
                await driver.executeScript("arguments[0].scrollIntoView()", oddsButton1);
                await oddsButton1.click();
                await driver.wait(until.elementLocated(By.xpath("//a[contains(text(), 'ОЗ')]")), 2000).click();
                await driver.wait(until.elementLocated(By.xpath("//div[contains(text(), 'Да')]")), 2000);

                let BTTSNOdd = null;
                let isNoBetAnymore = false;
                try {
                    const betFairImg = await driver.findElement(By.xpath("//img[@title='Betfair']"));
                    const betfairRaw = await driver.executeScript('return arguments[0].parentNode.parentNode.parentNode.parentNode;', betFairImg);
                    const oddCell = await betfairRaw.findElement(By.className('oddsCell__odd'));
                    const oddCellTitle = await oddCell.getAttribute('title');
                    isNoBetAnymore = oddCellTitle.includes('Букмекер больше не принимает ставку.');
                    const text = await betfairRaw.getText();
                    BTTSNOdd = +text.split('\n')[1];

                } catch (e) {
                    // console.log('no betfair', lineInfo);
                }

                if (isNoBetAnymore) {
                    // console.log('NO BET ANYMORE!!: ', lineInfo, BTTSNOdd);
                }

                if (BTTSNOdd >= 1 && !isNoBetAnymore) {
                    GoodMatches++;
                    const tscore = await driver.findElement(By.className('detailScore__wrapper'));
                    const tscoreText = await tscore.getText();
                    const tscoreArray = tscoreText.split('\n');

                    lineInfo = GoodMatches + '. ' + lineInfo;
                    if (+tscoreArray[0] === 0 || +tscoreArray[2] === 0) {
                        BALANCE += (BTTSNOdd - 1) * STAKE;
                        console.log('\x1b[36m%s\x1b[0m', 'WIN:)', lineInfo, firstAvg, secondAvg, 'BTTSNOdd', BTTSNOdd, 'BALANCE', BALANCE); // Cyan
                    } else if (!isNaN(+tscoreArray[0])) {
                        BALANCE -= STAKE;
                        console.log('LOOSE:((', lineInfo, firstAvg, secondAvg, 'BTTSNOdd', BTTSNOdd, 'BALANCE', BALANCE);
                    } else {
                        console.log('GOOD MATCH: ', lineInfo, BTTSNOdd);
                    }
                }
            }

            allWindows = await driver.getAllWindowHandles();
            await driver.close();
            await driver.switchTo().window(allWindows[0])
        }

        // try {
        //     driver.executeScript("arguments[0].scrollIntoView()", matches[0]);
        //     await checkMatch(matches[0])
        // } catch (e) {
        //     console.log(e);
        //     // const allWindows = await driver.getAllWindowHandles();

        //     // if (allWindows.length > 1) {
        //     //     await driver.switchTo().window(allWindows[allWindows.length - 1]);
        //     //     await driver.close();
        //     // }
        //     // await driver.switchTo().window(allWindows[0])
        // }


        for (const match of matches) {
            try {
                const text = await match.getText();

                driver.executeScript("arguments[0].scrollIntoView()", match);
                if (!text.includes('Перенесен') && !text.includes('Остановлен') && !text.includes('Отменен')) {

                    await checkMatch(match, text)
                }
            } catch (e) {
                // console.log(e);
                const allWindows = await driver.getAllWindowHandles();

                if (allWindows.length > 2) {
                    await driver.switchTo().window(allWindows[2]);
                    await driver.close();
                }
                if (allWindows.length > 1) {
                    await driver.switchTo().window(allWindows[1]);
                    await driver.close();
                }
                await driver.switchTo().window(allWindows[0])
            }
        }


    }


    console.log(BALANCE, GoodMatches);
    driver.quit();
})();
