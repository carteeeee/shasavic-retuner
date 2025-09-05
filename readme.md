# retuner

this is a very simple website that allows you to play using shasavic music theory thru webmidi.

> [!WARNING]
> this program is very new and likely has many bugs.
> please make an issue for any bugs you see!

## usage

i recommend [mitxela's reverse oscilloscope synth](https://mitxela.com/other/scope/latest/index.html) if you want a good in-browser synth to try this with!

> [!NOTE]
> this program does not act as a midi device itself. rather, it connects to midi devices to send midi commands to.

- open the website
- press the connect button
- in the dropdown, select the midi device to output to
- start playing!

to disconnect, simply close the tab.

## credits

i wrote all the code and the fonts and music theory are made by LΛMPLIGHT.

i also converted the lapisia font to woff (it was otf originally)

## important info

- this midi controller is monophonic, meaning it can only send one note at a time.
- Ah is tuned to 289.56Hz, so it is in tune with Yxeni.
- this program assumes your synth is tuned to A4=440Hz.
- a lot of numbers are currently hard programmed. i'll add settings for them later though!

for anything not mentioned here feel free to dm me on discord!

## todo
- [x] basic functionality
- [x] de-hardcode a lot of settings (such as bend range, A4 ref, Ah ref, etc)
- [ ] polyphony!
