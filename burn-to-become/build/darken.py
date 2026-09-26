"""One-time editorial pass: adds a darker, psychological cold open to every chapter,
a closing line ("the sting") at the end of each chapter, and a sharper first beat
to each Part opening. Safe to re-run: skips anything already inserted.
Usage: python3 darken.py"""
import glob, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
MS = os.path.join(HERE, '..', 'manuscript')

PARTS = {
 'I': ["You are not asleep. That is the problem.",
       "You are awake enough to function, to work, to answer messages, to seem fine—and asleep enough never to ask whose life this is."],
 'II': ["The war is not against the world. It is against a version of you that is comfortable, persuasive, and has never lost an argument."],
 'III': ["Every legend has a bill, a body count, and a secret. These chapters open all three."],
 'IV': ["The door was never locked. That is the most frightening thing anyone can say to a prisoner."],
 'V': ["Eventually every life is reduced to one question it cannot dodge: what was it for?"],
}

OPEN = {
1: ["Here is the part nobody says out loud.",
    "Most people do not ruin their lives. They postpone them. Quietly, politely, one reasonable evening at a time—until the postponement has a routine, an address, and their name on it.",
    "There is no warning. No alarm sounds on the day a temporary arrangement becomes a permanent life. The only signal is a feeling you have learned to scroll past: the faint, recurring sense that you are watching yourself from a distance.",
    "That feeling is not a mood. It is a message. This chapter is about reading it."],
2: ["Nobody builds a cage and walks into it. You build a room. Then a softer chair. Then a habit for the evenings, a reason for the mornings, an explanation for the weekends.",
    "One day you notice you have not left the room in years—and every single bar was made of something that felt good at the time.",
    "That is what makes comfort such an effective prison. It never has to lock the door. It only has to make the door feel unnecessary."],
3: ["You are the only witness to your own life who has never once been cross-examined.",
    "You were there for every skipped morning, every abandoned plan, every promise that quietly migrated to next week. And every time, you accepted the explanation. You never asked for evidence. You never checked the story against the receipts.",
    "Psychologists have known for decades what happens when our actions and our beliefs collide. We rarely change the actions. We change the story—until the story fits so well that we forget we wrote it.",
    "No court on earth would accept testimony like yours. You have been living by it for years."],
4: ["Fear is a terrible liar and a brilliant lawyer.",
    "It will never say, “I am afraid of being seen trying and failing.” It will say the timing is wrong, the plan needs work, the market is crowded, you should learn more first. It will make your fear sound like wisdom—so convincingly that you will thank it.",
    "And underneath sits a cruel piece of arithmetic. In one well-known experiment, students who were made to walk into a room wearing an embarrassing T-shirt guessed that about half the people there noticed. Only about a quarter did.",
    "You are hiding from an audience that is mostly looking at itself."],
5: ["There is a graveyard in your head.",
    "It is full of things that almost happened: the business you almost started, the message you almost sent, the body you almost built, the person you almost became. Nothing there died dramatically. Everything there died of waiting.",
    "And we are reliably wrong about time. In a classic study, students predicted they would finish their theses in about thirty-four days; the real average was about fifty-five, and fewer than a third finished when they said they would. “Almost” is often not a lack of will. It is a plan that was never honest about how long things take.",
    "Almost is the most flattering way to fail—because technically, you never did."],
6: ["Potential is the most beautiful thing you own. That is exactly why you have never used it.",
    "Used, it would become something smaller: a result, a number, a flawed draft, a performance someone could criticize. Unused, it stays perfect—a private treasure you can admire at night.",
    "But potential has an expiration date that nobody prints on the label. Every year you protect it, it becomes a little less potential and a little more regret."],
7: ["There are two people inside you, and only one of them is awake at six in the morning.",
    "The one who set the alarm last night was brave, certain, full of plans. The one who hears it is warm, tired, and an expert negotiator—and has never lost an argument with a version of you who is not in the room.",
    "Most days, this is the whole war. Not you against the world. You at night against you in the morning."],
8: ["Somewhere, people you will never meet are paid to study one question: how do we keep you here a little longer?",
    "They are very good at their jobs. The feed never ends, because an ending would give you a place to stop. The next video starts before you decide whether you want it. The rewards arrive at unpredictable moments, because behavioral science has known since the 1950s that unpredictable rewards are the ones we chase hardest.",
    "You are not weak for struggling against this. You are outnumbered. But outnumbered is not the same as powerless."],
9: ["Motivation is a drug with a short half-life, and you have been self-medicating for years.",
    "A video, a quote, a speech, a new plan—the rush arrives, the future feels close, and for one evening you are certain. Then the dose wears off and you are left with the same life, plus a thin new layer of disappointment in yourself.",
    "So you go looking for another dose. That is not a system. It is a cycle."],
10: ["“That’s just who I am.”",
     "It may be the most expensive sentence in the language. It sounds like self-knowledge. Often it is surrender with good branding.",
     "Identity feels like a discovery—something found, fixed, and true. But much of it was assembled from what happened to you, what you repeated, and what other people said about you before you were old enough to argue."],
11: ["Some truths do not arrive as revelations. They arrive as a small, cold drop in the stomach—and then you change the subject.",
     "Maybe you do not actually want the goal you keep talking about. Maybe you are more jealous than you admit. Maybe the people you blame were only partly responsible. Maybe you are not stuck at all. Maybe you are comfortable, and “stuck” is simply the more sympathetic word.",
     "You know that feeling. This chapter asks you not to change the subject."],
12: ["Look at your screen time. Multiply it by a year. Then by ten.",
     "Three hours a day is more than a thousand hours a year. Over a decade, it is close to two years of your waking life—given to things you would struggle to name a week later. Not stolen. Handed over, a few minutes at a time, to whatever asked loudest.",
     "Whatever receives your attention receives your life. There is no neutral ground. Something is being worshipped either way."],
13: ["Comfort sends its bill late.",
     "At twenty it costs almost nothing. At thirty, the interest begins to show. By forty, some people discover they have been paying in a currency they did not know they were spending: the skills never built, the risks never taken, the version of themselves who never got the chance to exist.",
     "Nobody itemizes this bill. That is why so many people are shocked by the total."],
14: ["There is a lie hiding inside the phrase “do hard things.”",
     "It lets you believe that pain is proof. That exhaustion means progress. That if it hurts, it must be working.",
     "Some people are not avoiding difficulty at all. They are drowning in it—hard work, hard hours, hard habits—pointed at nothing they chose. Suffering can be a hiding place of its own: if you are always this busy and this tired, nobody can accuse you of not trying. Not even you."],
15: ["It will not be a dramatic day.",
     "No failure, no rejection, no crisis. Just an ordinary Tuesday when you notice that the fire you started with has gone out, and the work is still there, looking at you, exactly as heavy as yesterday.",
     "This is the day most dreams actually die. Not in defeat. In boredom. Quietly, without anyone noticing—including the person who had the dream."],
16: ["Every skilled person you admire is standing on a pile of failures you will never see.",
     "Drafts deleted. Games lost. Offers ignored. Pitches laughed at. Nights they went home and wondered, honestly, whether they were fooling themselves.",
     "You only see the top of their pile. Then you compare it with the bottom of yours and conclude that you are not built for this. That conclusion is not humility. It is a measurement error."],
17: ["Somewhere in your head, there is an audience of one.",
     "Maybe a parent. A teacher. An ex. The friend who laughed. Someone who once looked at you and decided you were small.",
     "They may have forgotten that moment years ago. You have not. You have been performing for them ever since—every achievement another letter they will never read."],
18: ["The real you is not the one in the photographs.",
     "It is the one at eleven at night with nobody watching—the one who either keeps the small promise or quietly lets it go, knowing no one will ever find out.",
     "No one will ever find out. Except the only person whose opinion shapes everything you do next."],
19: ["Imagine giving twenty years to a summit—reaching it—and realizing, as the wind hits your face, that you never wanted to be here.",
     "It happens more often than people admit. The doctor who wanted to paint. The lawyer who wanted to build things with their hands. The founder who only ever wanted their father to be proud.",
     "The climb was real. The discipline was real. Only the mountain was borrowed."],
20: ["Nobody warns you that growth can feel like grief.",
     "You change, and some rooms go quiet when you walk in. Old jokes stop landing. People who knew the old you watch the new one with something between suspicion and loss. And some nights you miss the person you were—even though you worked so hard to leave them.",
     "This is the part of transformation they cut from the montage."],
21: ["Here is the sentence that ends a certain kind of childhood: nobody is coming.",
     "Not the mentor who will discover you. Not the lucky break that will make the decision for you. Not the perfect moment when fear finally leaves.",
     "For decades, psychologists believed that helplessness was learned—that people exposed to things they could not control learned to stop trying. In 2016, two of the scientists who first described learned helplessness looked back at fifty years of evidence and turned the idea around. Passivity in the face of prolonged stress, they concluded, is the default. What has to be learned is control: the discovery, through experience, that your actions change what happens next.",
     "Nobody is coming. It is a frightening sentence, and the most freeing one you will ever hear. If nobody is coming, you no longer have to wait."],
22: ["You have started this before.",
     "Maybe more than once. A new plan, a clean notebook, a Monday that was going to be different. Each beginning felt like proof that you were serious.",
     "Here is the uncomfortable pattern: the beginning has become your hiding place. As long as you keep starting, you never have to find out what happens in the middle."],
23: ["By the time he was thirty, he had marched an army across much of the known world—and he still could not stop.",
     "That is the part the legend does not dwell on. Not the victories. The hunger. The sense that no river, no empire, no crown was ever enough to quiet whatever was driving him east.",
     "You do not need an empire to know that hunger. You only need a finish line that moves every time you get close."],
24: ["The legend says he never lost.",
     "The truth is harder and more useful: we do not really know. What we know is that a man who lived by the sword spent his final years painting birds, writing, and trying to explain what decades of practice had taught him.",
     "Somewhere between the duelist and the old man in the cave, something changed. That change is what this chapter is about."],
25: ["He had everything the game could give—and decades later he was still keeping score against people who had slighted him as a teenager.",
     "That is not a footnote to greatness. For some people, it is the engine. And engines built from grievance run hot, run fast, and do not know how to stop."],
26: ["At twelve, he left his family, his island, and everything familiar, and cried at night in a city where nobody knew his name.",
     "We see the trophies. We rarely see the child who paid the entry fee.",
     "Every extraordinary life comes with an invoice. The question is not whether you are willing to dream. It is whether you would pay—and whether the dream is worth what it will cost the people who pay alongside you."],
27: ["Four times in one night, with the season on the line, an eighteen-year-old threw the ball at the rim and missed it entirely. In front of everyone.",
     "Most people would have carried that night as proof. Proof they were not ready. Proof they were not good enough. Proof the doubters were right.",
     "He carried it as a question instead: what exactly went wrong, and what do I do tomorrow?"],
28: ["Everything that could be taken from a man was taken from him: his family, his work, his manuscript, even his name, replaced by a number.",
     "He did not write that suffering made him stronger. He did not write that everything happens for a reason. What he wrote was more unsettling: that even in conditions built to destroy a person, something could remain that still chose how to respond.",
     "This chapter will not turn his life into a lesson. But it will sit with that sentence."],
29: ["The first thing you touch in the morning is not the person beside you, not the window, not your own thoughts. It is a glowing rectangle that already knows what you want to see.",
     "Before you have decided who you will be today, it has shown you who you are not: richer people, fitter people, happier people, people further along.",
     "You have not even stood up, and you are already behind."],
30: ["Some prisons have excellent lighting.",
     "A good salary. A nice apartment. Approving parents. A routine that runs itself. Everything is fine—and “fine” is the word you use when you have stopped expecting anything more.",
     "The worst cages are not the ones that hurt. They are the ones comfortable enough that leaving would look ungrateful."],
31: ["Freedom is terrifying in a way cages never are.",
     "In the cage, you knew who to blame: the job, the city, the people, the circumstances. The moment the door opens, the excuses walk out first—and you are left alone with the one question you were avoiding. Now what?",
     "Many people discover that they never wanted freedom. They wanted relief."],
32: ["You can move to a new city and wake up in the same life.",
     "Same habits. Same evenings. Same phone in the same hand at the same hour. The scenery changes; the script does not. Because the thing you were running from was never only the place.",
     "It was a pattern. And patterns do not need a passport."],
33: ["If you live to eighty, you get roughly four thousand weeks.",
     "Say it slowly. Four thousand. You have already spent a good number of them, and many of those you cannot remember at all.",
     "Every week, whether you notice or not, you trade one of them for something. The only question is whether you would make the same trade if someone showed you the price."],
34: ["Every yes is a funeral for a hundred other lives.",
     "Choose the career, and the other careers quietly die. Choose the person, and every other love story becomes a ghost. Choose the city, and every other street you might have walked disappears.",
     "This is why so many people refuse to choose. Not because they cannot decide—because they cannot bear to watch the other lives die."],
35: ["The people who love you will sometimes be the last ones to let you change.",
     "Not because they are cruel. Because your old self was part of their world—predictable, familiar, easy to be around. When you change, you rearrange their life a little, and nobody asked their permission.",
     "Sometimes the chains are made of love. They are still chains."],
36: ["Here is what nobody puts in the motivational speech: sometimes you do everything right, and it still fails.",
     "You prepare. You work. You sacrifice. And the door closes anyway—because of timing, luck, politics, health, or a decision made by someone who will never know your name.",
     "This is where most people learn the wrong lesson. They conclude that effort is pointless. The real lesson is harder: effort was never a guarantee. It was only ever better odds."],
37: ["The strangest pain is the one that arrives with the thing you wanted.",
     "You get the offer, the body, the number, the relationship. You wait for the feeling you were promised. And it comes—for a day, maybe a week. Then it fades, and you are standing inside your dream life feeling almost exactly like yourself.",
     "Nobody prepares you for this. They only prepare you for failure."],
38: ["There is no finish line. Read that again, because every part of you will resist it.",
     "No level after which the doubt stops. No achievement that settles, once and for all, whether you are enough. No morning when you wake up finished.",
     "For some readers this is the most depressing sentence in the book. For others, it is the moment the pressure finally lifts."],
39: ["Change has a body count, and the first body is your old self.",
     "Some part of you knows this, which is why you keep sabotaging the change. The old you is not a villain. It kept you alive. Now it is fighting for its life the only way it knows how—with excuses, nostalgia, and a voice that whispers, “This isn’t really you.”",
     "Let it speak. Then walk past it."],
40: ["The clock does not care that you had a hard childhood. It does not care that you were busy, that the timing was wrong, that you were going to start after the holidays.",
     "It does not hate you. That would be easier. It simply does not notice you at all, and it will keep moving at exactly the same speed whether you use this year or waste it.",
     "Everything you are postponing is being postponed inside a finite amount of time."],
41: ["Try to name your great-grandparents’ dreams.",
     "Most people cannot even name all eight of their great-grandparents. Four generations, and entire lives—their fears, loves, ambitions, and disappointments—are gone from living memory.",
     "This is not a reason for despair. It is a reason to stop living for an audience in the future. They will not remember. The people who can feel your life are the ones alive right now, within reach of your hands."],
42: ["One day you will do something for the last time and not know it.",
     "The last time you lift a child who is growing too big to be carried. The last ordinary conversation with a parent before everything changes. The last easy evening with a friend who is about to move away.",
     "Nobody announces last times. They are only visible looking back."],
43: ["Anger is excellent fuel and a terrible engine.",
     "It will get you out of bed at five. It will carry you through the first year. It will make you train when your body begs you to stop. And then one day you get what you wanted—the success, the proof, the revenge—and discover the fire has nothing left to burn except you."],
44: ["You are going to die with some of your dreams still inside you. That is not pessimism. It is arithmetic.",
     "The only question is how many—and whether the ones you let go were released on purpose or simply left to rot in the waiting room of “someday.”",
     "This is the last chapter. It is also the last time this book will ask you to wait."],
}

STING = {
1: "The most dangerous life is not the one that falls apart. It is the one that holds together just well enough that you never have to ask whether it was yours.",
2: "Comfort never has to lock the door. It only has to make you stop reaching for the handle.",
3: "The lie is rarely that you are bad. The lie is that you are fine—and have always had a good reason.",
4: "Fear rarely stops you by saying no. It stops you by saying “not yet”—forever.",
5: "Almost is the word we use when we want credit for a life we did not live.",
6: "Nobody will remember what you could have done. Eventually, not even you.",
7: "You will never meet an opponent who knows your weaknesses better—or forgives them faster.",
8: "Every easy thing is paid for. The only question is whether you pay in money, in attention, or in years.",
9: "The people you admire are not more motivated than you. They simply stopped asking their mood for permission.",
10: "You are not who you have always been. You are what you keep practicing.",
11: "What you refuse to look at does not disappear. It keeps making your decisions without your permission.",
12: "You do not have an attention problem. You have a sacrifice problem—you are just not the one choosing what gets sacrificed.",
13: "The bill for an easy life is always paid—usually by an older version of you who never got a vote.",
14: "Suffering is not the price of meaning. Sometimes it is just the price of never asking why.",
15: "Most dreams are not killed. They are abandoned in the middle, where nobody is watching.",
16: "Failure is not the opposite of the path. It is the path, seen up close.",
17: "You cannot win an argument with someone who is no longer in the room. You can only stop having it.",
18: "Character is what you rehearse when there is no audience—because in the end, there is no one else on stage.",
19: "Discipline in the service of someone else’s dream is just a more respectable way to be lost.",
20: "Every version of you that you outgrow has to be buried somewhere. Do it with respect.",
21: "The rescue you have been waiting for was always going to arrive in your own handwriting.",
22: "Beginning is not courage. Continuing is.",
23: "Ambition without a definition of enough is not a dream. It is a hunger that eats the person feeding it.",
24: "Mastery is not becoming dangerous to others. It is becoming dangerous to the version of you that keeps settling.",
25: "If winning is the only thing that makes you feel real, every victory is only a reprieve.",
26: "Talent is the ticket. Transformation is the years you spend becoming someone the ticket was never issued to.",
27: "Humiliation is only permanent if you let it write the conclusion.",
28: "Achievement can fill a life. Only meaning can hold it up.",
29: "The most effective cage is the one you carry willingly and unlock dozens of times a day.",
30: "Nobody pities someone in a beautiful cage. That is exactly what keeps them in it.",
31: "Freedom does not answer the question of your life. It only removes your excuse for not answering it.",
32: "Escape is an event. Freedom is a practice.",
33: "You are not spending time. You are spending your only life, one week at a time.",
34: "Refusing to choose is also a choice. It just kills every option slowly instead of all but one quickly.",
35: "You can honor where you came from without living there forever.",
36: "The plan was never the promise. You were.",
37: "Arrival is a place you visit. You still have to go home to yourself.",
38: "If there is no summit, you are allowed to sit down on the mountain and look at the view.",
39: "Let the old you die with dignity. Just do not let it keep driving.",
40: "Time is not running out. It is running—at the same speed as always—while you stand still.",
41: "You will be forgotten. Live in a way that mattered anyway.",
42: "Live as if last times are hiding inside ordinary days. They are.",
43: "Borrowed fire burns out. Chosen fire keeps you warm.",
}

MARK = '@@dark'  # not rendered; guards against double insertion


def main():
    files = sorted(glob.glob(os.path.join(MS, '0[1-6]_*.txt')))
    for f in files:
        lines = open(f, encoding='utf-8').read().split('\n')
        if any(l.startswith(MARK) for l in lines):
            print('already done', os.path.basename(f)); continue
        out, cur = [], None
        def close_chapter():
            if cur in STING:
                while out and not out[-1].strip():
                    out.pop()
                out.append('> ' + STING[cur]); out.append('')
        for l in lines:
            s = l.strip()
            if s.startswith(('@chapter ', '@part ', '@plate ', '@front ')):
                if cur is not None:
                    close_chapter(); cur = None
            out.append(l)
            if s.startswith('@part '):
                num = s.split('|')[0].split()[1]
                out.extend(PARTS[num])
            elif s.startswith('@chapter '):
                cur = int(s.split('|')[0].split()[1])
                out.extend(OPEN[cur])
        if cur is not None:
            close_chapter()
        out.insert(0, MARK)
        open(f, 'w', encoding='utf-8').write('\n'.join(out))
        print('updated', os.path.basename(f))


if __name__ == '__main__':
    main()
