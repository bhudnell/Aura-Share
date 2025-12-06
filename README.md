## I've taken over maintenance of this module from Fiona, so this is the repository going forward

![image](https://i.imgur.com/Up1jqTJ.png)

<strong>This mod is presently compatible with Pathfinder 1e</strong>

Aura Share: Automates the sharing of buffs between tokens. This makes handling auras easier. The conditions for automating the auras are listed in the notes below. (It's pretty simple)

## Instructions:

<p>Create a buff (item on a character sheet) and give it a radius.</p>
<img src="./assets/parentAura.png" alt="parent aura UI">

<sub>...the buff now automatically shares depending on the flags below:</sub> <br> <br>
<img src="./assets/auraOptions.png" alt="parent aura options">

- Share Inactive </br><sub>shares the buff even if it is toggled off. Great for buffs that only impact allies. <br></sub> <br>
- Share Hostile </br><sub>shares the buff with enemies (instead of allies). Typically combined with Share Inactive. <br></sub> <br>
- Share Neutral </br> <sub>shares the buff with targets with neutral disposition. <br></sub> <br>
- Share All </br> <sub>shares the buff with everyone regardless of disposition. <br></sub> <br>
- Share Unconscious </br><sub>shares the buff even if you're unconscious. (This works like the Diehard feat, but allows DMs more control over individual auras.) <br></sub> <br>

<p>Child auras have a simplified UI that allows them to see the parent aura (if they have permission to view it)</p>
<img src="./assets/childAura.png" alt="child aura UI">

## Conditions for Applying Auras <br>

<strong>Adds the buff to allies if:</strong> <br>

- The source actor has a buff with a radius > 0. <br>
- The buff is enabled, OR if the source actor's buff has the Share Inactive option. <br>

<strong>Adds the buff to allies when:</strong> <br>

- They enter range (either actor can move). <br>
- The buff is toggled on. <br>
- A Token is created in the scene, and allies are in range. <br>
- The aura actor's HP rises above 0. <br>

<strong>Adds the buff to enemies if:</strong> <br>

- The buff also has the Share Hostile option. Note: You typically would combine this with the Share Inactive option so that the buff doesn't hurt the source actor. <br>

<strong>Deactives or Deletes the buff when:</strong> <br>
<sub>NOTE: These can be toggled between activate auras and delete auras in the module settings</sub> <br>

- The source moves out of range. <br>
- The recipient moves out of range. <br>
- The source disables the buff, and the buff does not have the "alliesOnly" Boolean Flag <br>
- The source's HP falls below zero, unless: It has the Diehard feat -OR- Unconscious Auras is toggled OFF in the menus. <br>

<strong>Deletes the buff when:</strong> <br>

- the source is deleted.
