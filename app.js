// ==========================================
// METRONOME & BACKING TRACKS APP
// ==========================================

// Audio Context
let audioContext = null;

// Initialize Audio Context on user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// ==========================================
// METRONOME
// ==========================================

const metronome = {
    isPlaying: false,
    bpm: 120,
    beatsPerMeasure: 4,
    currentBeat: 0,
    intervalId: null,

    // Create a click sound using Web Audio API
    playClick(isAccent = false) {
        const ctx = initAudio();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Accent beat is higher pitch
        oscillator.frequency.value = isAccent ? 1000 : 800;
        oscillator.type = 'sine';

        // Short click envelope
        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        oscillator.start(now);
        oscillator.stop(now + 0.1);
    },

    updateBeatIndicator() {
        const beats = document.querySelectorAll('.beat');
        beats.forEach((beat, index) => {
            beat.classList.remove('active', 'accent');
            if (index === this.currentBeat) {
                beat.classList.add('active');
                if (index === 0) beat.classList.add('accent');
            }
        });
    },

    tick() {
        this.playClick(this.currentBeat === 0);
        this.updateBeatIndicator();
        this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
    },

    start() {
        if (this.isPlaying) return;

        initAudio();
        this.isPlaying = true;
        this.currentBeat = 0;

        const interval = (60 / this.bpm) * 1000;
        this.tick(); // Play first beat immediately
        this.intervalId = setInterval(() => this.tick(), interval);

        // Update button
        const btn = document.getElementById('metronome-toggle');
        btn.classList.add('playing');
        btn.querySelector('.btn-text').textContent = 'Stop';
        btn.querySelector('.play-icon').innerHTML = '&#9632;';
    },

    stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.currentBeat = 0;

        // Reset beat indicators
        document.querySelectorAll('.beat').forEach(beat => {
            beat.classList.remove('active', 'accent');
        });

        // Update button
        const btn = document.getElementById('metronome-toggle');
        btn.classList.remove('playing');
        btn.querySelector('.btn-text').textContent = 'Start';
        btn.querySelector('.play-icon').innerHTML = '&#9658;';
    },

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    },

    setBpm(newBpm) {
        this.bpm = Math.max(40, Math.min(220, newBpm));
        document.getElementById('bpm-value').textContent = this.bpm;
        document.getElementById('bpm-slider').value = this.bpm;

        // Restart if playing to apply new tempo
        if (this.isPlaying) {
            this.stop();
            this.start();
        }
    },

    setTimeSignature(beats) {
        this.beatsPerMeasure = beats;
        this.currentBeat = 0;

        // Update beat indicators
        const container = document.getElementById('beat-indicator');
        container.innerHTML = '';
        for (let i = 0; i < beats; i++) {
            const beatEl = document.createElement('span');
            beatEl.className = 'beat';
            container.appendChild(beatEl);
        }
    }
};

// ==========================================
// BACKING TRACKS (Synthesized)
// ==========================================

const backingTracks = {
    currentTrack: null,
    isPlaying: false,
    volume: 0.8,
    intervalId: null,
    audioNodes: [],

    // Drum patterns for different genres
    patterns: {
        rock: {
            bpm: 120,
            name: 'Rock Groove',
            // Pattern: kick on 1,3; snare on 2,4; hi-hat on all 8ths
            sequence: [
                { time: 0, type: 'kick' },
                { time: 0, type: 'hihat' },
                { time: 0.5, type: 'hihat' },
                { time: 1, type: 'snare' },
                { time: 1, type: 'hihat' },
                { time: 1.5, type: 'hihat' },
                { time: 2, type: 'kick' },
                { time: 2, type: 'hihat' },
                { time: 2.5, type: 'hihat' },
                { time: 3, type: 'snare' },
                { time: 3, type: 'hihat' },
                { time: 3.5, type: 'hihat' },
            ]
        },
        blues: {
            bpm: 80,
            name: 'Blues Shuffle',
            sequence: [
                { time: 0, type: 'kick' },
                { time: 0, type: 'hihat' },
                { time: 0.66, type: 'hihat' },
                { time: 1, type: 'snare' },
                { time: 1, type: 'hihat' },
                { time: 1.66, type: 'hihat' },
                { time: 2, type: 'kick' },
                { time: 2, type: 'hihat' },
                { time: 2.66, type: 'hihat' },
                { time: 3, type: 'snare' },
                { time: 3, type: 'hihat' },
                { time: 3.66, type: 'hihat' },
            ]
        },
        metal: {
            bpm: 140,
            name: 'Metal Riff',
            sequence: [
                { time: 0, type: 'kick' },
                { time: 0, type: 'hihat' },
                { time: 0.25, type: 'kick' },
                { time: 0.5, type: 'hihat' },
                { time: 0.75, type: 'kick' },
                { time: 1, type: 'snare' },
                { time: 1, type: 'kick' },
                { time: 1.5, type: 'hihat' },
                { time: 1.75, type: 'kick' },
                { time: 2, type: 'kick' },
                { time: 2, type: 'hihat' },
                { time: 2.25, type: 'kick' },
                { time: 2.5, type: 'hihat' },
                { time: 2.75, type: 'kick' },
                { time: 3, type: 'snare' },
                { time: 3, type: 'kick' },
                { time: 3.5, type: 'hihat' },
                { time: 3.75, type: 'kick' },
            ]
        },
        funk: {
            bpm: 100,
            name: 'Funk Groove',
            sequence: [
                { time: 0, type: 'kick' },
                { time: 0, type: 'hihat' },
                { time: 0.5, type: 'hihat' },
                { time: 0.75, type: 'kick' },
                { time: 1, type: 'snare' },
                { time: 1, type: 'hihat' },
                { time: 1.5, type: 'hihat' },
                { time: 2, type: 'hihat' },
                { time: 2.5, type: 'kick' },
                { time: 2.5, type: 'hihat' },
                { time: 3, type: 'snare' },
                { time: 3, type: 'hihat' },
                { time: 3.25, type: 'kick' },
                { time: 3.5, type: 'hihat' },
            ]
        }
    },

    // Synthesize drum sounds
    playSound(type) {
        const ctx = initAudio();

        if (type === 'kick') {
            // Kick drum - low frequency with pitch drop
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
            gain.gain.setValueAtTime(this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.start(now);
            osc.stop(now + 0.3);
        }
        else if (type === 'snare') {
            // Snare - noise burst with tone
            const noise = ctx.createBufferSource();
            const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            noise.buffer = noiseBuffer;

            const noiseGain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            const now = ctx.currentTime;
            noiseGain.gain.setValueAtTime(this.volume * 0.5, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            noise.start(now);
            noise.stop(now + 0.15);

            // Add tonal component
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.connect(oscGain);
            oscGain.connect(ctx.destination);
            osc.frequency.value = 200;
            oscGain.gain.setValueAtTime(this.volume * 0.3, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
        else if (type === 'hihat') {
            // Hi-hat - filtered noise
            const noise = ctx.createBufferSource();
            const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            noise.buffer = noiseBuffer;

            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 7000;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            gain.gain.setValueAtTime(this.volume * 0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            noise.start(now);
            noise.stop(now + 0.05);
        }
    },

    playPattern(genre) {
        const pattern = this.patterns[genre];
        if (!pattern) return;

        const beatDuration = 60 / pattern.bpm; // Duration of one beat in seconds
        const measureDuration = beatDuration * 4 * 1000; // 4 beats per measure in ms

        // Play one measure
        pattern.sequence.forEach(note => {
            setTimeout(() => {
                if (this.isPlaying && this.currentTrack === genre) {
                    this.playSound(note.type);
                }
            }, note.time * beatDuration * 1000);
        });
    },

    play(genre) {
        // Stop any currently playing track
        this.stop();

        const pattern = this.patterns[genre];
        if (!pattern) return;

        initAudio();
        this.isPlaying = true;
        this.currentTrack = genre;

        // Update UI
        document.getElementById('track-controls').style.display = 'block';
        document.getElementById('current-track-name').textContent = pattern.name;

        document.querySelectorAll('.track').forEach(track => {
            track.classList.remove('playing');
            if (track.dataset.genre === genre) {
                track.classList.add('playing');
            }
        });

        // Calculate measure duration
        const beatDuration = 60 / pattern.bpm;
        const measureDuration = beatDuration * 4 * 1000;

        // Play first measure immediately
        this.playPattern(genre);

        // Loop the pattern
        this.intervalId = setInterval(() => {
            if (this.isPlaying) {
                this.playPattern(genre);
            }
        }, measureDuration);
    },

    stop() {
        this.isPlaying = false;
        this.currentTrack = null;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Update UI
        document.querySelectorAll('.track').forEach(track => {
            track.classList.remove('playing');
        });
    },

    setVolume(value) {
        this.volume = value / 100;
    }
};

// ==========================================
// CHORD LIBRARY
// ==========================================

const chordLibrary = {
    currentChord: null,
    currentCategory: 'beginner',

    // Chord data: strings are numbered 6 (low E) to 1 (high E)
    // Fret 0 = open, -1 = muted, 1-5 = fret number
    // Fingers: 1=index, 2=middle, 3=ring, 4=pinky, 0=open
    chords: {
        beginner: {
            'C': {
                name: 'C Major',
                frets: [-1, 3, 2, 0, 1, 0],
                fingers: [0, 3, 2, 0, 1, 0],
                notes: ['C', 'E', 'G', 'C', 'E'],
                tip: 'Keep your fingers curved and close to the frets'
            },
            'G': {
                name: 'G Major',
                frets: [3, 2, 0, 0, 0, 3],
                fingers: [2, 1, 0, 0, 0, 3],
                notes: ['G', 'B', 'D', 'G', 'B', 'G'],
                tip: 'Use your pinky for the high E string'
            },
            'D': {
                name: 'D Major',
                frets: [-1, -1, 0, 2, 3, 2],
                fingers: [0, 0, 0, 1, 3, 2],
                notes: ['D', 'A', 'D', 'F#'],
                tip: 'Only strum the top 4 strings'
            },
            'Em': {
                name: 'E Minor',
                frets: [0, 2, 2, 0, 0, 0],
                fingers: [0, 2, 3, 0, 0, 0],
                notes: ['E', 'B', 'E', 'G', 'B', 'E'],
                tip: 'One of the easiest chords - great for beginners!'
            },
            'Am': {
                name: 'A Minor',
                frets: [-1, 0, 2, 2, 1, 0],
                fingers: [0, 0, 2, 3, 1, 0],
                notes: ['A', 'E', 'A', 'C', 'E'],
                tip: 'Similar shape to E major, just moved up one string'
            },
            'E': {
                name: 'E Major',
                frets: [0, 2, 2, 1, 0, 0],
                fingers: [0, 2, 3, 1, 0, 0],
                notes: ['E', 'B', 'E', 'G#', 'B', 'E'],
                tip: 'A powerful open chord, great for rock!'
            },
            'A': {
                name: 'A Major',
                frets: [-1, 0, 2, 2, 2, 0],
                fingers: [0, 0, 1, 2, 3, 0],
                notes: ['A', 'E', 'A', 'C#', 'E'],
                tip: 'Keep fingers close together on the 2nd fret'
            },
            'Dm': {
                name: 'D Minor',
                frets: [-1, -1, 0, 2, 3, 1],
                fingers: [0, 0, 0, 2, 3, 1],
                notes: ['D', 'A', 'D', 'F'],
                tip: 'Only strum the top 4 strings'
            }
        },
        intermediate: {
            'F': {
                name: 'F Major',
                frets: [1, 3, 3, 2, 1, 1],
                fingers: [1, 3, 4, 2, 1, 1],
                notes: ['F', 'A', 'C', 'F', 'A', 'F'],
                tip: 'Mini barre chord - press strings 1 & 2 with index finger'
            },
            'B7': {
                name: 'B7',
                frets: [-1, 2, 1, 2, 0, 2],
                fingers: [0, 2, 1, 3, 0, 4],
                notes: ['B', 'F#', 'B', 'D#', 'A'],
                tip: 'Common in blues progressions'
            },
            'G7': {
                name: 'G7',
                frets: [3, 2, 0, 0, 0, 1],
                fingers: [3, 2, 0, 0, 0, 1],
                notes: ['G', 'B', 'D', 'G', 'B', 'F'],
                tip: 'Adds tension that resolves to C'
            },
            'C7': {
                name: 'C7',
                frets: [-1, 3, 2, 3, 1, 0],
                fingers: [0, 3, 2, 4, 1, 0],
                notes: ['C', 'E', 'Bb', 'C', 'E'],
                tip: 'Great for blues and jazz'
            },
            'Am7': {
                name: 'A Minor 7',
                frets: [-1, 0, 2, 0, 1, 0],
                fingers: [0, 0, 2, 0, 1, 0],
                notes: ['A', 'E', 'G', 'C', 'E'],
                tip: 'Smooth jazzy sound'
            },
            'Em7': {
                name: 'E Minor 7',
                frets: [0, 2, 0, 0, 0, 0],
                fingers: [0, 2, 0, 0, 0, 0],
                notes: ['E', 'B', 'D', 'G', 'B', 'E'],
                tip: 'Super easy - just one finger!'
            },
            'Dsus4': {
                name: 'D Suspended 4',
                frets: [-1, -1, 0, 2, 3, 3],
                fingers: [0, 0, 0, 1, 2, 3],
                notes: ['D', 'A', 'D', 'G'],
                tip: 'Creates tension, wants to resolve to D'
            },
            'Asus2': {
                name: 'A Suspended 2',
                frets: [-1, 0, 2, 2, 0, 0],
                fingers: [0, 0, 1, 2, 0, 0],
                notes: ['A', 'E', 'A', 'B', 'E'],
                tip: 'Open, dreamy sound'
            }
        },
        barre: {
            'Bm': {
                name: 'B Minor',
                frets: [-1, 2, 4, 4, 3, 2],
                fingers: [0, 1, 3, 4, 2, 1],
                notes: ['B', 'F#', 'B', 'D', 'F#'],
                tip: 'Barre the 2nd fret with your index finger',
                barreStart: 2
            },
            'F#m': {
                name: 'F# Minor',
                frets: [2, 4, 4, 2, 2, 2],
                fingers: [1, 3, 4, 1, 1, 1],
                notes: ['F#', 'C#', 'F#', 'A', 'C#', 'F#'],
                tip: 'Full barre chord based on Em shape',
                barreStart: 2
            },
            'Bb': {
                name: 'Bb Major',
                frets: [-1, 1, 3, 3, 3, 1],
                fingers: [0, 1, 2, 3, 4, 1],
                notes: ['Bb', 'F', 'Bb', 'D', 'F'],
                tip: 'A shape barre chord at 1st fret',
                barreStart: 1
            },
            'C#m': {
                name: 'C# Minor',
                frets: [-1, 4, 6, 6, 5, 4],
                fingers: [0, 1, 3, 4, 2, 1],
                notes: ['C#', 'G#', 'C#', 'E', 'G#'],
                tip: 'Am shape moved up 4 frets',
                barreStart: 4
            },
            'Eb': {
                name: 'Eb Major',
                frets: [-1, 6, 5, 3, 4, 3],
                fingers: [0, 4, 3, 1, 2, 1],
                notes: ['Eb', 'Bb', 'Eb', 'G', 'Bb'],
                tip: 'C shape barre chord',
                barreStart: 3
            },
            'G#m': {
                name: 'G# Minor',
                frets: [4, 6, 6, 4, 4, 4],
                fingers: [1, 3, 4, 1, 1, 1],
                notes: ['G#', 'D#', 'G#', 'B', 'D#', 'G#'],
                tip: 'Em shape at 4th fret',
                barreStart: 4
            },
            'Cm': {
                name: 'C Minor',
                frets: [-1, 3, 5, 5, 4, 3],
                fingers: [0, 1, 3, 4, 2, 1],
                notes: ['C', 'G', 'C', 'Eb', 'G'],
                tip: 'Am shape at 3rd fret',
                barreStart: 3
            },
            'D#': {
                name: 'D# Major',
                frets: [-1, 6, 8, 8, 8, 6],
                fingers: [0, 1, 2, 3, 4, 1],
                notes: ['D#', 'A#', 'D#', 'G', 'A#'],
                tip: 'A shape at 6th fret',
                barreStart: 6
            }
        }
    },

    // Note frequencies for audio playback
    noteFrequencies: {
        'C': 130.81, 'C#': 138.59, 'Db': 138.59,
        'D': 146.83, 'D#': 155.56, 'Eb': 155.56,
        'E': 164.81,
        'F': 174.61, 'F#': 185.00, 'Gb': 185.00,
        'G': 196.00, 'G#': 207.65, 'Ab': 207.65,
        'A': 220.00, 'A#': 233.08, 'Bb': 233.08,
        'B': 246.94
    },

    // String tuning (standard) - frequencies
    stringFrequencies: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63], // E A D G B E

    init() {
        this.renderChordGrid();
        this.setupEventListeners();
        // Select first chord by default
        const firstChord = Object.keys(this.chords.beginner)[0];
        this.selectChord(firstChord);
    },

    renderChordGrid() {
        const grid = document.getElementById('chord-grid');
        grid.innerHTML = '';

        const chords = this.chords[this.currentCategory];
        for (const [key, chord] of Object.entries(chords)) {
            const btn = document.createElement('button');
            btn.className = 'chord-btn';
            btn.dataset.chord = key;
            btn.innerHTML = `
                <span class="chord-label">${key}</span>
                <span class="chord-sublabel">${chord.name.includes('Minor') ? 'minor' : chord.name.includes('7') ? '7th' : chord.name.includes('sus') ? 'sus' : 'major'}</span>
            `;
            grid.appendChild(btn);
        }
    },

    selectChord(chordKey) {
        const chord = this.chords[this.currentCategory][chordKey];
        if (!chord) return;

        this.currentChord = { key: chordKey, ...chord };

        // Update UI
        document.querySelectorAll('.chord-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.chord === chordKey);
        });

        document.getElementById('chord-name').textContent = chordKey;
        document.getElementById('chord-type').textContent = chord.name;
        document.getElementById('chord-fingers').textContent = `Fingers: ${this.getFingerDescription(chord.fingers)}`;
        document.getElementById('chord-tips').textContent = chord.tip;

        this.renderFretboard(chord);
    },

    getFingerDescription(fingers) {
        const fingerNames = ['open', 'index', 'middle', 'ring', 'pinky'];
        const used = new Set(fingers.filter(f => f > 0));
        return Array.from(used).map(f => fingerNames[f]).join(', ') || 'all open';
    },

    renderFretboard(chord) {
        const container = document.getElementById('fretboard');
        const numFrets = 5;
        const numStrings = 6;

        // Determine starting fret for display
        const nonZeroFrets = chord.frets.filter(f => f > 0);
        const minFret = Math.min(...nonZeroFrets) || 1;
        const maxFret = Math.max(...nonZeroFrets) || 1;
        const startFret = maxFret <= 5 ? 1 : minFret;

        const width = 180;
        const height = 200;
        const stringSpacing = 28;
        const fretSpacing = 35;
        const leftPadding = 40;
        const topPadding = 30;

        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

        // Draw fret number
        if (startFret > 1) {
            svg += `<text x="${leftPadding - 5}" y="${topPadding + fretSpacing / 2 + 5}"
                    font-size="12" fill="#888" text-anchor="end">${startFret}fr</text>`;
        }

        // Draw nut (if starting at fret 1)
        if (startFret === 1) {
            svg += `<rect x="${leftPadding}" y="${topPadding - 3}"
                    width="${(numStrings - 1) * stringSpacing}" height="6" fill="#e94560"/>`;
        }

        // Draw frets
        for (let fret = 0; fret <= numFrets; fret++) {
            const y = topPadding + fret * fretSpacing;
            svg += `<line x1="${leftPadding}" y1="${y}"
                    x2="${leftPadding + (numStrings - 1) * stringSpacing}" y2="${y}"
                    stroke="#444" stroke-width="2"/>`;
        }

        // Draw strings
        for (let string = 0; string < numStrings; string++) {
            const x = leftPadding + string * stringSpacing;
            svg += `<line x1="${x}" y1="${topPadding}"
                    x2="${x}" y2="${topPadding + numFrets * fretSpacing}"
                    stroke="#888" stroke-width="${3 - string * 0.3}"/>`;
        }

        // Draw finger positions and markers
        const fingerColors = ['#444', '#e94560', '#27ae60', '#3498db', '#f39c12'];

        for (let string = 0; string < numStrings; string++) {
            const fret = chord.frets[string];
            const finger = chord.fingers[string];
            const x = leftPadding + string * stringSpacing;

            if (fret === -1) {
                // Muted string - X
                svg += `<text x="${x}" y="${topPadding - 10}"
                        font-size="14" fill="#e94560" text-anchor="middle">X</text>`;
            } else if (fret === 0) {
                // Open string - O
                svg += `<text x="${x}" y="${topPadding - 10}"
                        font-size="14" fill="#27ae60" text-anchor="middle">O</text>`;
            } else {
                // Finger position
                const displayFret = fret - startFret + 1;
                const y = topPadding + (displayFret - 0.5) * fretSpacing;

                svg += `<circle cx="${x}" cy="${y}" r="10" fill="${fingerColors[finger] || fingerColors[1]}"/>`;
                svg += `<text x="${x}" y="${y + 4}"
                        font-size="11" fill="white" text-anchor="middle" font-weight="bold">${finger}</text>`;
            }
        }

        // Draw barre indicator if present
        if (chord.barreStart) {
            const barreStrings = chord.fingers.filter((f, i) => f === 1 && chord.frets[i] === chord.barreStart);
            if (barreStrings.length > 1) {
                const firstBarreString = chord.fingers.indexOf(1);
                const lastBarreString = chord.fingers.lastIndexOf(1);
                const displayFret = chord.barreStart - startFret + 1;
                const y = topPadding + (displayFret - 0.5) * fretSpacing;
                const x1 = leftPadding + firstBarreString * stringSpacing;
                const x2 = leftPadding + lastBarreString * stringSpacing;

                svg += `<rect x="${x1 - 10}" y="${y - 8}"
                        width="${x2 - x1 + 20}" height="16" rx="8"
                        fill="#e94560" opacity="0.8"/>`;
            }
        }

        svg += '</svg>';
        container.innerHTML = svg;
    },

    playChord(asArpeggio = false) {
        if (!this.currentChord) return;

        const ctx = initAudio();
        const chord = this.currentChord;
        const now = ctx.currentTime;

        chord.frets.forEach((fret, stringIndex) => {
            if (fret === -1) return; // Skip muted strings

            const baseFreq = this.stringFrequencies[stringIndex];
            const frequency = baseFreq * Math.pow(2, fret / 12);

            const delay = asArpeggio ? (5 - stringIndex) * 0.08 : 0;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = frequency;

            osc.connect(gain);
            gain.connect(ctx.destination);

            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + (asArpeggio ? 1.5 : 2));

            osc.start(now + delay);
            osc.stop(now + delay + 2);
        });
    },

    setCategory(category) {
        this.currentCategory = category;
        this.renderChordGrid();

        document.querySelectorAll('.chord-cat-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        // Select first chord in new category
        const firstChord = Object.keys(this.chords[category])[0];
        this.selectChord(firstChord);
    },

    setupEventListeners() {
        // Category buttons
        document.querySelectorAll('.chord-cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setCategory(btn.dataset.category);
            });
        });

        // Chord selection
        document.getElementById('chord-grid').addEventListener('click', (e) => {
            const btn = e.target.closest('.chord-btn');
            if (btn) {
                this.selectChord(btn.dataset.chord);
            }
        });

        // Play buttons
        document.getElementById('play-chord').addEventListener('click', () => {
            this.playChord(false);
        });

        document.getElementById('play-arpeggio').addEventListener('click', () => {
            this.playChord(true);
        });
    }
};

// ==========================================
// CHORD TRAINER
// ==========================================

const chordTrainer = {
    isRunning: false,
    intervalId: null,
    speed: 2000,
    availableChords: [],

    init() {
        this.setupEventListeners();
    },

    start() {
        if (this.isRunning) return;

        // Get chords from current category
        this.availableChords = Object.keys(chordLibrary.chords[chordLibrary.currentCategory]);
        if (this.availableChords.length < 2) return;

        this.isRunning = true;
        this.showRandomChord();

        this.intervalId = setInterval(() => {
            this.showRandomChord();
        }, this.speed);

        // Update button
        const btn = document.getElementById('trainer-toggle');
        btn.classList.add('playing');
        btn.querySelector('.btn-text').textContent = 'Stop Training';
        btn.querySelector('.play-icon').innerHTML = '&#9632;';
    },

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        clearInterval(this.intervalId);
        this.intervalId = null;

        document.getElementById('trainer-current').textContent = '-';

        // Update button
        const btn = document.getElementById('trainer-toggle');
        btn.classList.remove('playing');
        btn.querySelector('.btn-text').textContent = 'Start Training';
        btn.querySelector('.play-icon').innerHTML = '&#9658;';
    },

    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    },

    showRandomChord() {
        const randomIndex = Math.floor(Math.random() * this.availableChords.length);
        const chord = this.availableChords[randomIndex];

        const display = document.getElementById('trainer-current');
        display.textContent = chord;
        display.classList.remove('flash');
        void display.offsetWidth; // Trigger reflow
        display.classList.add('flash');

        // Also select the chord in the library
        chordLibrary.selectChord(chord);
    },

    setSpeed(speed) {
        this.speed = speed;
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    },

    setupEventListeners() {
        document.getElementById('trainer-toggle').addEventListener('click', () => {
            this.toggle();
        });

        document.getElementById('trainer-speed').addEventListener('change', (e) => {
            this.setSpeed(parseInt(e.target.value));
        });
    }
};

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize chord library and trainer
    chordLibrary.init();
    chordTrainer.init();

    // Metronome controls
    document.getElementById('metronome-toggle').addEventListener('click', () => {
        metronome.toggle();
    });

    document.getElementById('bpm-slider').addEventListener('input', (e) => {
        metronome.setBpm(parseInt(e.target.value));
    });

    document.getElementById('bpm-decrease').addEventListener('click', () => {
        metronome.setBpm(metronome.bpm - 5);
    });

    document.getElementById('bpm-increase').addEventListener('click', () => {
        metronome.setBpm(metronome.bpm + 5);
    });

    document.getElementById('time-signature').addEventListener('change', (e) => {
        metronome.setTimeSignature(parseInt(e.target.value));
    });

    // Backing track controls
    document.querySelectorAll('.btn-track-play').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const genre = e.target.dataset.track;
            if (backingTracks.currentTrack === genre && backingTracks.isPlaying) {
                backingTracks.stop();
            } else {
                backingTracks.play(genre);
            }
        });
    });

    document.getElementById('track-stop').addEventListener('click', () => {
        backingTracks.stop();
        document.getElementById('track-controls').style.display = 'none';
    });

    document.getElementById('volume-slider').addEventListener('input', (e) => {
        backingTracks.setVolume(parseInt(e.target.value));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            metronome.toggle();
        }
        if (e.code === 'ArrowUp') {
            e.preventDefault();
            metronome.setBpm(metronome.bpm + 5);
        }
        if (e.code === 'ArrowDown') {
            e.preventDefault();
            metronome.setBpm(metronome.bpm - 5);
        }
    });
});

// ==========================================
// INSTRUCTIONS (shown in console)
// ==========================================
console.log('%c Ezgi\'s Guitar Studio ', 'background: #e94560; color: white; font-size: 16px; padding: 5px;');
console.log('Keyboard shortcuts:');
console.log('  Space - Start/Stop metronome');
console.log('  Arrow Up - Increase BPM');
console.log('  Arrow Down - Decrease BPM');
console.log('Rock on, Ezgi! 🎸');
