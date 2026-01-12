# Fretboard Visualizer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/sebastian-ederer/fretboard-visualizer/pulls)

An interactive guitar fretboard visualization tool for learning music theory. Click or paint notes on the fretboard to visualize scales, patterns, and chord shapes.

Available at: [https://fretboardvisualizer.viridianblue.com/](https://fretboardvisualizer.viridianblue.com/)

> [!NOTE]
> This entire app was vibe-coded using [Claude Code](https://claude.ai/code).

## ✨ Features

### 🎯 Interactive Fretboard

- Click to toggle notes on/off
- Click and drag to paint multiple notes
- **Variable string count**: Support for 4-12 strings (bass, standard, extended range guitars)
- **Multiple tunings**: Standard, Drop D, DADGAD, Open G, Open D, Half Step Down, and custom tuning

### 🎼 Scale Visualization

- **Scales**: Pentatonic, Blues, Diatonic, and all 7 modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian), plus Melodic Minor
- **Key Selection**: All 12 keys with Major/Minor mode toggle
- **Display Options**: Show note names or interval notation, toggle between sharps and flats

### 📐 Shape Overlays

- **Pentatonic Shapes**: Visual overlay for the 5 pentatonic box positions
- **3NPS Shapes**: 7 three-notes-per-string scale patterns with highlighting

### 🎵 Metronome

- Adjustable tempo with slider and tap tempo
- Configurable time signatures (1-16 beats, various beat units)
- Multiple click sounds with volume control
- Accent first beat option
- Count-in feature (1 bar)
- Auto tempo increase for practice sessions

### 🔵 Circle of Fifths

- Interactive visualization of key relationships
- Major keys (outer ring) and relative minor keys (inner ring)
- Highlights diatonic chords for the selected key

### 💾 Presets & Export

- Save and load custom presets
- Import/export presets as JSON files
- Export fretboard as PNG or SVG image
- Auto-save to local storage

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/sebastian-ederer/fretboard-visualizer.git
   cd fretboard-visualizer
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Contributing 🤝

Contributions are welcome! Whether it's bug fixes, new features, or just improving the docs — all help is appreciated. 🙌

1. Fork the repo and create your branch
2. Make your changes
3. Run `npm run check` and `npm run lint` to catch any issues
4. Open a pull request

Got questions or ideas? Feel free to [open an issue](https://github.com/sebastian-ederer/fretboard-visualizer/issues)!

## 📄 License

```txt
MIT License
Copyright (c) 2026 Sebi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
