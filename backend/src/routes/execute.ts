import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.post('/', (req, res) => {
  const { language, files } = req.body;
  
  if (!['c', 'cpp', 'python'].includes(language) || !files || files.length === 0) {
    return res.status(400).json({ message: 'Unsupported language or invalid request.' });
  }

  const code = files[0].content;
  const id = Date.now().toString() + Math.floor(Math.random() * 1000);
  
  const tempDir = path.join(__dirname, '../../temp_exec');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const fileExt = language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'c';
  const srcFile = path.join(tempDir, `code_${id}.${fileExt}`);
  const exeFile = path.join(tempDir, `code_${id}.exe`);

  fs.writeFileSync(srcFile, code);

  if (language === 'python') {
    exec(`python "${srcFile}"`, { timeout: 5000 }, (runError, runStdout, runStderr) => {
      try { fs.unlinkSync(srcFile); } catch (e) {}
      if (runError) {
        return res.json({ run: { output: runStderr || runError.message } });
      }
      res.json({ run: { output: runStdout } });
    });
  } else {
    const compiler = language === 'cpp' ? 'g++' : 'gcc';
    exec(`${compiler} "${srcFile}" -o "${exeFile}"`, (compileError, stdout, stderr) => {
      if (compileError) {
        try { fs.unlinkSync(srcFile); } catch (e) {}
        return res.json({ run: { output: stderr } });
      }

      exec(`"${exeFile}"`, { timeout: 5000 }, (runError, runStdout, runStderr) => {
        // Cleanup files
        try {
          fs.unlinkSync(srcFile);
          fs.unlinkSync(exeFile);
        } catch (e) {}

        if (runError) {
          return res.json({ run: { output: runStderr || runError.message } });
        }

        res.json({ run: { output: runStdout } });
      });
    });
  }
});

export default router;
