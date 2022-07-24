# hack-vm-translator
A VM translator for the HACK computer.

## About

This project covers the assignments in first and second chapters of the course [Build a Modern Computer from First Principles: Nand to Tetris Part II](https://www.coursera.org/learn/nand2tetris2/home/info). You can learn more about the assignments and what they set out to do [here](https://drive.google.com/file/d/19fe1PeGnggDHymu4LlVY08KmDdhMVRpm/view) and [here](https://drive.google.com/file/d/1lBsaO5XKLkUgrGY6g6vLMsiZo6rWxlYJ/view)

## Getting Started

### Prerequisites

- [NodeJS v18](https://nodejs.org/download/release/latest-v18.x/)


### Installation

1. Clone the repo

   ```sh
   git clone https://github.com/MlkMahmud/hack-vm-translator.git
   ```

2. Install dependencies
   ```sh
   cd hack-vm-translator/
   npm install
   ```


### Usage
  ```sh
    npm run translate [ src.vm ] or [ src/ ]
  ```

  **Note: to translate a directory, the directory must contain at least, a Sys.vm file.** 