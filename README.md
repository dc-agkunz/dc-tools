# DC-Tools

Hey, just a few little tidbits I've made to make my life easier.

Use them.  Or don't 🤷.

## General

Configure your `.env` file.

-   `MARKING_DIR`: A spot on your disk where all of your submissions are kept.  Submission commands will look here.

## Commands

**`$ npm run submit:check ${PROJECT_NAME} ${SECTION_NUMBER}`**
-   Based on the submission guidelines from [INFT 2202](https://inft2202.opentech.durhamcollege.org/notes/general/submissions), attempt to check out the commit that was submitted to DC Connect.
-   `PROJECT_NAME` is either `ice` or `lab`.
-   `SECTION_NUMBER` is which section directory to look in.
-   Example, where `MARKING_DIR=/home/adam/dc_marking`
    -   `$ npm run submit:check ice 07`
    -   From: `/home/adam/dc_marking/ice/07/123456-123456 - Adam Kunz - Jan 12, 2025, 641 PM - dc-agkunz.txt`
    -   To: `/home/adam/dc_marking/ice/07/Adam Kunz - dc-agkunz`

**`$ npm run submit:rename ${SUBMISSION_DIR}`**
-   Will rename all submissions in the `SUBMISSION_DIR` directory.
-   Example, where `MARKING_DIR=/home/adam/dc_marking`: 
    -   `$ npm run submit:rename labs/lab1`
    -   From: `/home/adam/dc_marking/labs/lab1/123456-123456 - Adam Kunz - Jan 12, 2025, 641 PM - lab1assignment.zip`
    -   To: `/home/adam/dc_marking/labs/lab1/Adam Kunz - lab1assignment.zip`
