const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const fs = require('fs');
const path = require('path');

(async () => {
    console.log('loading ....');
    
    // NETWORK OPTION
    const networkOption =  {
        timeout: 3000000
    }

    // LOGIN LINK
    const url = 'https://sso.teachable.com/secure/210848/users/sign_in?clean_login=true&reset_purchase_session=1';
    const emailUser = ''
    const passwordUser = ''

    const firstCourseLink = "https://pro.academind.com/courses/enrolled/767924"
    const baseURL = "https://pro.academind.com"

    try {
        // PUPPETER SETTING
        const browser = await puppeteer.launch({
            headless: false, args: ['--start-maximized']
        });
        const page = await browser.newPage();

        // GO TO SIGN IN PAGE
        await page.goto(url, networkOption);

        // SIGN IN
        await page.type('#user_email', emailUser);
        await page.type('#user_password', passwordUser);
        await page.keyboard.press('Enter');

        // WAIT FOR PAGE LOAD AND ALL ALREADY AUTHENTICATED
        await page.waitForNavigation(networkOption);

        // GET ALL COURSE LINK LIST
        await page.goto(firstCourseLink, networkOption)
        const listOfContent = await page.content()
        const $lc = await cheerio.load(listOfContent)

        console.log('collecting list of course ....');
        const courseLink = $lc('.item').map( function() {
            return $lc(this).attr('href')
        }).get();

        // START COLLECTING DATA
        let itemDownload = []
        const allSize = courseLink.length
        let counter = 0

        console.log('collecting list all course data to download ....');
        for (const courseItem of courseLink) {
            counter ++

            await page.goto(baseURL + courseItem, networkOption)
            const contentCourse = await page.content()
            const $ = await cheerio.load(contentCourse)
    
            console.log(counter + '/' + allSize);

            itemDownload.push({
                title: $('.download').attr('data-x-origin-download-name'),
                download_link: $('.download').attr('href') 
            })
        }

        // INSERT DATA TO /storage/data.json
        const filePath = path.join(
            path.dirname(process.mainModule.filename), 
            'storage', 
            'data.json'
        )
        fs.writeFile(filePath, JSON.stringify(itemDownload), err => {
            if(!err){
                console.log('--------------- FINISHED ---------------');
            }else{
                console.log(err);
            }
        });

        // CLOSE BROWSER
        await browser.close();

    } catch (error) {
        console.log(error);
    }

})();