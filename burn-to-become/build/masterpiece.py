"""Second editorial pass: the Wanderer parable (one Interlude before each Part) and a lived-in
scene for each chapter of Part II. Safe to re-run: skips files already updated.
Usage: python3 masterpiece.py"""
import glob, os

HERE = os.path.dirname(os.path.abspath(__file__))
MS = os.path.join(HERE, '..', 'manuscript')
MARK = '@@story'

INTERLUDES = {
'I': ('The Room', [
 "There was once a wanderer who had stopped wandering.",
 "It had not happened on purpose. First the wanderer rested in a room at the edge of the road, because the road was long and the rain was cold. Then the room acquired a chair, and the chair acquired a shape, and the evenings acquired a rhythm, and the rhythm acquired a name: *for now*.",
 "In the wall of the room there was a door. Through the gap beneath it came a thin line of light, and on some nights, when everything else was quiet, the sound of wind moving over a mountain the wanderer had once meant to climb.",
 "The wanderer knew the door was there. The wanderer had studied it for years—its hinges, its handle, the grain of its wood—and could have described it better than anyone alive.",
 "The wanderer had never once tried the handle.",
 "“Tomorrow,” the wanderer said, as always, and lay down, and the light under the door went on shining for no one."]),
'II': ('The Mirror', [
 "One night the wanderer could not sleep and went to the basin to wash, and in the water there were two faces.",
 "One was the face the wanderer knew: tired, familiar, forgiving. The other was the same face, but awake—leaner, quieter, with eyes that looked straight back.",
 "“Who are you?” the wanderer asked.",
 "“The one you keep promising to become,” said the reflection. “I have been waiting a long time.”",
 "“I am almost ready.”",
 "“You have been almost ready for eleven years.”",
 "The wanderer wanted to argue, and had excellent arguments: the weather, the timing, the weight of the pack, the danger on the mountain. The wanderer began to list them. The reflection did not interrupt. It simply waited, the way water waits, until the arguments ran out and the room was quiet again.",
 "“Every reason you have given me is true,” it said at last. “And none of them is the reason.”",
 "The wanderer looked away first. But that night, for the first time, the wanderer put a hand on the door."]),
'III': ('The River of Others', [
 "The door opened onto a road, and the road ran down to a river, and at the river the wanderer found that others had come this way before.",
 "A young king sat alone in a tent on the near bank, staring east at a country he would never cross. An old swordsman sat on a rock with a brush in his hand, painting a bird on a dead branch. A boy stood at the water’s edge, throwing ball after ball at a rim that was not there. Farther on, a man in a thin coat was writing on scraps of paper in the cold, as if the words were the only warm thing left.",
 "“Are you the great ones?” the wanderer asked.",
 "“We were people,” said the swordsman, without looking up. “The songs made us great. The songs leave out the bills.”",
 "“Then what should I learn from you?”",
 "“Not how to be us,” said the king. “We are already taken.”",
 "The wanderer crossed the river alone, and on the far bank noticed, for the first time, that the road forked—and that one of the paths had no footprints on it at all."]),
'IV': ('The Village of Open Cages', [
 "On the far side of the river, the wanderer came to a village of cages.",
 "They were beautiful. Some were gilded; some were carved; some had soft beds and bright windows and screens that glowed all night. In each one, someone sat comfortably, looking out at the road.",
 "Most of the doors were open.",
 "“Why do you stay?” the wanderer asked a man in a particularly fine cage.",
 "“Stay?” The man seemed puzzled. “I am not staying. I am resting. I will leave when things settle down.”",
 "“How long have you been resting?”",
 "The man opened his mouth, and closed it, and looked at his open door as if seeing it for the first time. Then he turned back to the glowing screen.",
 "The wanderer walked faster after that and did not look back, and understood something that would take years to put into words: a cage does not need a lock if it is comfortable enough, and freedom is not the absence of walls but the willingness to keep walking when the walls are warm."]),
'V': ('The Fire', [
 "Near the top of the mountain there was no village, no river, no song. Only wind, and a single fire burning in a ring of stones, and an old woman feeding it one stick at a time.",
 "“Is this the summit?” the wanderer asked.",
 "“There is no summit,” she said. “There is only the next ridge, and the fire.”",
 "The wanderer sat. For a long time neither of them spoke. The fire was not large. It did not roar. It simply burned, steadily, and everything near it could be seen.",
 "“I thought I would have to burn myself to get here,” the wanderer said at last.",
 "“Many do,” said the old woman. “They arrive as ash, and mistake the smoke for the view.” She placed another stick on the flames. “The fire was never meant to consume you. It was meant to show you what matters, and to keep you warm while you carry it.”",
 "“And what do I do now?”",
 "She smiled, and for a moment her face looked strangely like the reflection in the basin, long ago.",
 "“Now,” she said, “you choose what to carry down the mountain.”"]),
}

SCENES = {
7: "Picture a Tuesday at 6:04 a.m. The alarm has already been snoozed twice. In the dark, a whole negotiation takes place in under a minute: you slept badly; the workout can move to the evening; the evening will be free. The evening is never free. By 6:05 the decision is made, and it does not feel like a decision at all—it feels like common sense. That is how most lost days are lost: not in a dramatic surrender, but in a quiet ninety-second meeting where the only person present votes for comfort and calls it reason. The meeting will happen again tomorrow. The only question is whether the part of you that wants the future will be allowed to attend.",
8: "Imagine sitting down to work on something that matters. Forty seconds in, the first hard sentence arrives—the one you do not yet know how to write. Your hand moves to your phone before you have decided anything. Twenty-six minutes later you surface, slightly numb, remembering almost nothing of what you saw, and the hard sentence is still there, exactly where you left it, a little heavier now. Nothing terrible happened. That is the problem. The escape was so small and so smooth that it did not even register as a choice. Now multiply it by every hard sentence in a year.",
9: "Picture someone at one in the morning, wide awake after a video about discipline. They write a new schedule: five o’clock wake-up, cold shower, gym, deep work, no sugar, no phone. For a moment they feel like a different person. At five, the alarm goes off, and the different person is gone. The one who remains feels only the cold and a faint shame. By Thursday the schedule is abandoned. By Sunday they are looking for another video. They were never short of motivation—they had plenty at one in the morning. They had built a plan that could only be carried out by someone who does not exist at five.",
10: "Imagine someone who has said since school, “I’m not a math person.” It began with one harsh teacher and one humiliating test. Twenty years later the sentence is still making decisions: which jobs they apply for, which conversations they leave, whether they ever look closely at their own finances. Nobody tested the sentence again. It simply hardened, the way a splint hardens around a bone that healed long ago. The saddest identities are not the false ones. They are the ones that were true once, for a little while, and were never updated.",
11: "Picture someone who has wanted to start a business “for years.” Ask why they have not, and the answers are ready: money, timing, family, the economy. All real. Then ask a different question—“If someone handed you the money tomorrow, would you start on Monday?”—and watch the pause. In that pause lives the truth they have been protecting. They are not sure they want the business. They want to be the kind of person who could have one. That is a completely different goal, and no amount of money will ever satisfy it.",
12: "Imagine two people with the same twenty-four hours. One gives the first hour of every day to a craft, before anyone else can claim it. The other gives the first hour to messages, news, and other people’s emergencies, and plans to reach the craft “when things calm down.” Things never calm down. After five years, the first person has given the work roughly eighteen hundred hours. The second has given it scraps. Neither is more talented. One simply decided who would receive the best of their attention before the world could decide for them.",
13: "Picture a forty-year-old who, at twenty-two, was the most promising musician in their town. They did not fail. They never tested it. A stable job arrived, then a comfortable apartment, then a life in which the guitar began to feel like a teenage costume. Nothing went wrong. Most evenings are pleasant. But sometimes, hearing someone else play, they feel a grief they cannot explain to anyone—grief for a person who was never allowed to exist, and was never even asked.",
14: "Imagine someone who trains twice a day, works twelve-hour shifts, sleeps five hours, and posts about the grind. By every visible measure, they are doing hard things. Ask what it is all for, and the answer turns vague: success, being better, not being average. Now imagine an injury forces them to stop for two months. The panic that follows is not really about their body. It is about who they are if they are not suffering. For some people, hardship is not a path. It is an identity—and they would rather hurt than find out who they are without it.",
15: "Picture the forty-third day of learning a language. The novelty is gone. The app no longer celebrates you as warmly. You can order a coffee, but you cannot follow a single sentence in a film. You are past the stage where progress is visible and nowhere near the stage where it is useful. Nobody posts day forty-three. There is no badge for it. And yet day forty-three, and the hundred days like it, are the whole reason anyone ever becomes fluent in anything.",
16: "Imagine a comedian’s first night on stage. Five minutes. The room is half empty and entirely silent. Someone coughs. The walk back to the seat is the longest walk of their life. Most people who have that night never go back. The ones who become good do not feel less shame. They simply return the next week, and the week after, and discover that the silence changes a little each time—that it can be studied, learned from, and eventually turned into laughter. The first hundred nights are not the price of becoming good. They are how becoming good works.",
17: "Picture someone who finally gets the promotion, the house, the car—everything the people who doubted them said they would never have. They imagine the moment the doubters find out. Then, slowly, they realize the doubters are not going to find out. They are busy with their own lives. One of them has moved away; one of them has died. The victory lap is being run in an empty stadium, and the runner is exhausted.",
18: "Imagine two people who both promise themselves to read for twenty minutes before bed. On the first night, both are tired. One reads for five minutes and falls asleep. The other decides that it does not count unless it is twenty, and reads nothing. A month later, the first has finished two books and, more importantly, has become someone who reads before bed. The second has broken the same promise thirty times and has learned something far more dangerous: that promises to themselves are optional.",
19: "Picture a young doctor in the fourth year of training, excellent at the work and hollow inside. Every call home brings their parents’ pride like warm water. Every walk through the hospital doors makes something in them go quiet. They cannot remember the last time they chose anything. The path chose them at sixteen, when they were good at science and someone they loved said, “You’ll be a doctor.” They are not failing. They are succeeding at a life that fits like a borrowed coat.",
20: "Imagine someone who stops drinking. Within a month, their evenings are clearer, their mornings are better, their bank account is healthier—and their friendships are strangely thin. The group chat goes quiet. The invitations stop. Nobody was cruel. The friendships had simply been built on a shared habit, and when the habit left, it took the scaffolding with it. This is the price nobody prints on the poster: sometimes getting better means being lonelier for a while.",
21: "Picture someone who has been waiting six years for a mentor—someone older, wiser, and generous, who will see their potential and open the door. They have read about such mentors in every success story. In six years, they have never sent a single message asking anyone for advice. Point this out, and they are genuinely surprised. They had been waiting to be discovered. It had not occurred to them that discovery is usually the result of being visible, and that visibility is something you do, not something that happens to you.",
}


def main():
    for f in sorted(glob.glob(os.path.join(MS, '0[1-6]_*.txt'))):
        lines = open(f, encoding='utf-8').read().split('\n')
        if any(l.startswith(MARK) for l in lines):
            print('already done', os.path.basename(f)); continue
        out, cur, heads = [], None, 0
        for l in lines:
            s = l.strip()
            if s.startswith('@chapter '):
                cur, heads = int(s.split('|')[0].split()[1]), 0
            if s.startswith('### ') and cur in SCENES:
                heads += 1
                if heads == 2:  # the scene sits between the chapter's first and second sections
                    out.append(SCENES[cur]); out.append('')
            out.append(l)
            if s.startswith('@part '):
                num = s.split('|')[0].split()[1]
                title, paras = INTERLUDES[num]
                out.append(f'@interlude {num} | {title}')
                out.extend(paras)
                out.append('@endinterlude')
        out.insert(0, MARK)
        open(f, 'w', encoding='utf-8').write('\n'.join(out))
        print('updated', os.path.basename(f))


if __name__ == '__main__':
    main()
