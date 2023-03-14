# Public Goods Tool
## Background
The PG Tool was built to allow researchers and land managers alike to easily identify the public
goods that are being created on their land and through data collected under various indicators. The
tool was also built with flexibility and adaptability in mind, with numerous custom versions being
built over the years to address specific research interests.

Further details about the history and use of the PG Tool can be found at
https://www.organicresearchcentre.com/our-research/research-project-library/public-goods-tool/.
This website structure developed in collaboration with [MVARC](https://mvarc.eu/), is the
latest iteration based upon the original PG Tool v3.1 Excel-based farm sustainability assessment tool created by [Organic Research Centre](https://www.organicresearchcentre.com) in 2011. It offers an interface that makes this tool accessible (and its corresponding [API](https://github.com/organicresearchcentre/pgtool-api)) and available for farmers, advisors and researchers to interact and learn with it.

For any queries about the PG Tool please contact github@organicresearchcentre.com.

## How to run the website

This is currently configured to run in the path "/pgtool-gui". Wether you want to run this in your local computer, or upload it to some server, there are two configurations that need to be adapted for other paths:

- in the `.htaccess` file: replace all "pgtool-gui" string occurrences to the desired path.

- in the `js/script.js` file: replace `base: '/pgtool-gui'` to the desired path.
