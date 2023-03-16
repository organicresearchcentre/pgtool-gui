# Public Goods Tool
## Background
The PG Tool was built to allow researchers and land managers alike to easily identify the public
goods that are being created on their land through data collected under various indicators. The
tool was also built with flexibility and adaptability in mind, with numerous custom versions being
built over the years to address specific research interests.

This website structure, developed in collaboration with [MVARC](https://mvarc.eu/), is the
latest iteration based upon the original PG Tool v3.1 Excel-based farm sustainability assessment tool created by [Organic Research Centre](https://www.organicresearchcentre.com). It offers an interface that makes this tool accessible (and its corresponding [API](https://github.com/organicresearchcentre/pgtool-api)) and available for farmers, advisors and researchers to interact and learn with it.

You can access this version of the PG Tool at the ORC website here (TBA).

A user guide for self-assessments has also been created for this version of PG Tool available [here](https://github.com/organicresearchcentre/pgtool-gui/blob/main/PG%20Tool%20Online%20v3.1%20Manual.md).

For developers there is further infromation about the design and future development of the PG Tool available [here](https://github.com/organicresearchcentre/pgtool-gui/blob/main/PG%20Tool%20Online%20Development.md).

For any queries about the PG Tool please contact github@organicresearchcentre.com.

## How to run the website

If you want to host this version of the PG Tool on your local computer or server, then simply download the files for the GUI and place them in the desired directory. If you just want the underlying code without this web interface, then please see the [API](https://github.com/organicresearchcentre/pgtool-api).

The GUI is currently configured to run in the path "/pgtool-gui". If you wish to use another path i.e. for a customised version, then there are two required alterations:

- in the `.htaccess` file: replace all "pgtool-gui" string occurrences to the desired path.

- in the `js/script.js` file: replace `base: '/pgtool-gui'` to the desired path.
