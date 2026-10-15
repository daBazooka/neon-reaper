# Single source of truth for the "conspiracies that came true" film.
import json
CH={1:'THEY EXPERIMENTED ON US',2:'THEY LIED US INTO WAR',3:'THEY WATCHED US',4:'COUPS & COVERT OPS',5:'COMPANIES THAT KNEW',6:'SCANDALS WE LIVED THROUGH'}
# deep dives: id,ch,title,years,icon,f1,f2,proof,outcome,lines
D=[
('u02',1,'THE TUSKEGEE SYPHILIS STUDY','1932–1972','syringe',
 '600 Black men studied · 399 had syphilis · told it was "bad blood"','Penicillin withheld for decades so doctors could keep watching','Whistleblower leak to the press (1972) · US apology (1997)','Led to the National Research Act & informed-consent rules',
 ["Case one. The Tuskegee syphilis study. For forty years, from nineteen thirty two to nineteen seventy two, the United States Public Health Service watched six hundred Black men in Macon County, Alabama. Three hundred and ninety nine of them had syphilis.",
  "They were told they were being treated for bad blood. They were not. Even after penicillin became the standard cure, the men were not given it, so doctors could keep observing the disease.",
  "It ended only because a whistleblower leaked it to the press in nineteen seventy two. By then, twenty eight participants had died of syphilis, and about a hundred more from related complications.",
  "In nineteen ninety seven, President Clinton formally apologized. The scandal led to the National Research Act, and to the modern rules on informed consent."]),
('u03',1,'MKULTRA','1953–1973','brain',
 'CIA program to control minds: LSD, hypnosis, sensory deprivation','Some subjects never knew they were part of it','Files ordered destroyed (1973) · misfiled records found (1977) · Senate hearings','Full scope: unknowable, most files destroyed',
 ["Case two. MKUltra. In nineteen fifty three, the CIA began a secret program to find ways to control human minds, using drugs like LSD, hypnosis, and sensory deprivation.",
  "Some experiments were done on people who had no idea. A chemist named Sidney Gottlieb ran much of it.",
  "In nineteen seventy three, CIA director Richard Helms ordered the files destroyed. But in nineteen seventy seven, a cache of misfiled financial records was found, and Senate hearings followed. Sources differ on the exact number of documents, from about sixteen thousand to twenty thousand.",
  "The Church Committee concluded the full scope could never be known, because so much had been destroyed."]),
('u05',2,'OPERATION NORTHWOODS','1962','plane',
 'Joint Chiefs memo proposed staging attacks and blaming Cuba','Ideas: fake a civilian airliner shootdown · sink a US ship · fake an attack on Guantanamo','Memo of March 13, 1962 · declassified in 1997','Rejected, never carried out',
 ["Case three. Operation Northwoods. In March nineteen sixty two, the chairman of the Joint Chiefs of Staff, General Lyman Lemnitzer, signed a memo to the Defense Secretary proposing a pretext for invading Cuba.",
  "The ideas included staging attacks and blaming Cuba. Faking the shootdown of a civilian airliner. Sinking a U.S. Navy ship. Staging a fabricated assault on the Guantanamo naval base.",
  "It was rejected. Kennedy made clear the U.S. was not going to use military force that way, and Lemnitzer was not reappointed. It was never carried out.",
  "The memo stayed secret until nineteen ninety seven, when it was declassified. It is one of the clearest written examples of top American officers proposing a false flag."]),
('u06',2,'THE GULF OF TONKIN','1964','ship',
 'Aug 4, 1964: a "second attack" on US destroyers was reported','Congress passed the Gulf of Tonkin Resolution, enabling escalation in Vietnam','NSA declassified 140+ documents and a historian\'s study (2005)','Study: no second attack happened',
 ["Case four. The Gulf of Tonkin. On August fourth, nineteen sixty four, the Johnson administration said North Vietnamese boats had attacked American destroyers for a second time.",
  "Congress responded with the Gulf of Tonkin Resolution, giving the President broad power to escalate in Vietnam.",
  "In two thousand five, the NSA declassified more than a hundred and forty documents, and an internal study by historian Robert Hanyok. It concluded that no second attack happened that night, and that signals intelligence had been misread, with some analysis altered to fit the story.",
  "The war that followed lasted for years afterward."]),
('u08',3,'WATERGATE','1972–1974','tape',
 'June 17, 1972: burglars caught inside the Democratic National Committee offices','The White House denied any link, then covered it up','Secret White House tapes · Supreme Court ruled 8–0 to hand them over (1974)','Aug 9, 1974: Nixon resigned',
 ["Case five. Watergate. On June seventeenth, nineteen seventy two, burglars were caught inside the Democratic National Committee offices at the Watergate complex.",
  "The White House denied any link. Then came the cover-up, the payments, and the lies.",
  "A secret taping system had recorded the President. In July nineteen seventy four, the Supreme Court ruled eight to zero that Nixon had to hand over the tapes.",
  "On August ninth, nineteen seventy four, Richard Nixon resigned. He is the only U.S. president ever to do so."]),
('u09',3,'COINTELPRO','1956–1971','eye',
 'FBI secretly infiltrated and disrupted civil-rights and antiwar groups','Wiretaps, burglaries, forged documents, threatening anonymous letters (including to Martin Luther King Jr.)','March 8, 1971: activists burgled an FBI office in Media, PA and mailed 1,000+ files to reporters','Church Committee hearings · new limits on the FBI',
 ["Case six. COINTELPRO. From nineteen fifty six, the FBI ran a secret program to infiltrate and disrupt political groups, including civil rights and antiwar organizations.",
  "The methods included wiretaps, burglaries, forged documents, and anonymous letters. In nineteen sixty four, the FBI sent Martin Luther King, Junior, a threatening anonymous letter and a tape.",
  "On March eighth, nineteen seventy one, eight activists broke into an FBI office in Media, Pennsylvania, and took more than a thousand documents. They mailed them to journalists.",
  "Hoover ended the program that spring. Congress then investigated, and the Church Committee led to new limits on how the FBI can investigate."]),
('u10',3,'MASS SURVEILLANCE','2013','phone',
 'Claim: the government collects everyone\'s phone records','June 2013: Edward Snowden leaked documents on NSA bulk collection and internet-company programs','Courts: 2015 appeals ruling (Patriot Act did not authorize it) · 2020 ruling (violated FISA)','Bulk phone-records program ended by Congress (2015)',
 ["Case seven. Mass surveillance. For years, people who said the government was collecting everyone's phone records were called paranoid.",
  "In June twenty thirteen, former NSA contractor Edward Snowden leaked documents showing the agency collected the phone records of millions of Americans in bulk, and ran programs that gathered data from internet companies.",
  "In twenty fifteen, a federal appeals court ruled that the Patriot Act did not authorize the bulk collection of phone records. In twenty twenty, another court found the program did violate federal surveillance law, and may have violated the Constitution.",
  "Congress ended the bulk collection program in twenty fifteen."]),
('u11',3,'IRAN–CONTRA','1985–1987','crates',
 'Reagan officials secretly sold weapons to Iran to free hostages','Profits were diverted to the Contra rebels, though Congress had banned that aid','Exposed by a Lebanese magazine (Nov 1986) · independent counsel Lawrence Walsh','11 convicted · some overturned · pardons in 1992',
 ["Case eight. Iran-Contra. In the mid nineteen eighties, members of the Reagan administration secretly sold weapons to Iran, which was under an arms embargo, hoping to free American hostages in Lebanon.",
  "Millions of dollars from those sales were diverted to fund the Contra rebels in Nicaragua, even though Congress had barred that aid.",
  "It broke in November nineteen eighty six, when a Lebanese magazine revealed the arms deals. An independent counsel, Lawrence Walsh, investigated, and eleven people were convicted.",
  "Some convictions were overturned on appeal, and in December nineteen ninety two, President George H. W. Bush pardoned several of those involved."]),
('u12',4,'OPERATION AJAX','1953','barrel',
 'Iran\'s elected prime minister Mossadegh was overthrown','The CIA and British MI6 organized it after he nationalized Iran\'s oil','CIA acknowledged its role in declassified documents (2013)','Britain has never publicly admitted its role',
 ["Case nine. Operation Ajax. In nineteen fifty three, Iran's elected prime minister, Mohammad Mossadegh, was overthrown.",
  "For decades, it was dismissed as a conspiracy theory that the CIA and British intelligence organized it, because Mossadegh had nationalized Iran's oil industry.",
  "In August twenty thirteen, documents declassified and posted by the National Security Archive included the CIA's own acknowledgment that the coup was carried out under its direction, as an act of U.S. foreign policy.",
  "The British government has still never publicly admitted its role."]),
('u14',5,'BIG TOBACCO','1950s–2006','cig',
 'Companies said smoking\'s harms were unproven and nicotine was not addictive','Internal documents showed they knew otherwise, and targeted the young','Federal court, Judge Kessler (Aug 2006): a "massive 50-year scheme to defraud"','Appeals court upheld the core verdict (2009)',
 ["Case ten. Big Tobacco. For decades, cigarette companies said the link between smoking and disease was unproven, and that nicotine was not addictive.",
  "Internal documents showed they knew otherwise, and that they marketed to young people.",
  "In August two thousand six, federal judge Gladys Kessler ruled that the major companies had run a fifty year scheme to defraud the public, in violation of racketeering law.",
  "A federal appeals court upheld the core of the verdict in two thousand nine."]),
('u15',5,'LEADED GASOLINE','1921–2021','pump',
 '1921: Thomas Midgley found tetraethyl lead stopped engine knock','Plant workers died of lead poisoning; officials said exhaust lead was unproven dangerous','Geochemist Clair Patterson showed environmental lead had soared','UN: leaded petrol ended worldwide in 2021',
 ["Case eleven. Leaded gasoline. In nineteen twenty one, General Motors researcher Thomas Midgley found that adding tetraethyl lead stopped engine knock.",
  "Workers at the early plants suffered agonizing lead poisoning, and some died. Yet industry officials argued the lead in exhaust had not been proven dangerous.",
  "Geochemist Clair Patterson showed that lead in the environment had risen enormously after leaded gasoline arrived, and fought the industry for years.",
  "In August twenty twenty one, the United Nations announced that leaded petrol had finally ended worldwide, a step it estimated prevents more than one point two million premature deaths a year."]),
('u16',5,'THE SUGAR COVER-UP','1960s–2016','cube',
 'Sugar industry wanted fat, not sugar, blamed for heart disease','It paid three Harvard scientists ≈ $6,500 (≈ $50,000 today) for a 1967 review','Internal documents published in JAMA Internal Medicine (2016)','Review published without disclosing the funding',
 ["Case twelve. The sugar industry. In the nineteen sixties, as scientists debated what causes heart disease, the sugar industry wanted fat to take the blame.",
  "The Sugar Research Foundation paid three Harvard scientists about sixty five hundred dollars, roughly fifty thousand dollars today, for a review that downplayed sugar. It was published in nineteen sixty seven in the New England Journal of Medicine, without disclosing the funding.",
  "In twenty sixteen, researcher Cristin Kearns and colleagues published the internal documents in JAMA Internal Medicine.",
  "One of the authors later helped shape U.S. dietary guidelines. Critics say it derailed the conversation about sugar for decades."]),
('u17',5,'EXXON KNEW','1977–2003','thermo',
 'Exxon\'s own scientists studied global warming from the 1970s','Science (2023): its internal projections were largely accurate','Study: public statements cast doubt on science its own data supported','Now central to climate litigation',
 ["Case thirteen. Exxon. In the nineteen seventies and eighties, the oil company's own scientists studied climate change.",
  "A twenty twenty three study in the journal Science, by Geoffrey Supran, Stefan Rahmstorf, and Naomi Oreskes, found that Exxon's internal projections from nineteen seventy seven to two thousand three were largely accurate.",
  "At the same time, the researchers argue, the company's public statements cast doubt on the science.",
  "What the industry knew, and when, is now a central question in climate litigation."]),
('u18',5,'OXYCONTIN','1996–2020','pill',
 'Purdue marketed OxyContin as less likely to cause addiction','2007: Purdue and 3 executives pleaded guilty · ≈ $634.5 M','Oct 2020: DOJ resolution ≈ $8.3 B · three felony counts · Sacklers: $225 M civil','Largest penalties ever on a drug maker (DOJ)',
 ["Case fourteen. OxyContin. In the nineteen nineties, Purdue Pharma marketed the painkiller as less likely to cause addiction.",
  "In May two thousand seven, Purdue and three executives pleaded guilty to misleading the public about the drug's risk of addiction, and the company paid about six hundred and thirty four million dollars.",
  "In October two thousand twenty, the Justice Department announced an eight point three billion dollar resolution, in which Purdue agreed to plead guilty to three felony counts, the largest penalties ever levied against a pharmaceutical manufacturer.",
  "The Sackler family, who owned the company, agreed to a separate two hundred and twenty five million dollar civil payment."]),
('u19',5,'DIESELGATE','2015','exhaust',
 'Sept 2015: EPA accused Volkswagen of cheating emissions tests','Software detected tests and switched on full controls only then','About 11 million vehicles worldwide · VW pleaded guilty in the US','$4.3 B US penalties · total cost estimated ≈ $21 B',
 ["Case fifteen. Dieselgate. In September twenty fifteen, the U.S. Environmental Protection Agency accused Volkswagen of cheating.",
  "Its diesel cars carried software that detected when they were being tested, and switched on full emissions controls only then. On the road, they polluted far more.",
  "Volkswagen said about eleven million vehicles worldwide had discrepancies. The company pleaded guilty to conspiracy and obstruction in the United States.",
  "It agreed to pay four point three billion dollars in civil and criminal penalties in the U.S., and the total cost has been estimated at around twenty one billion."]),
('u21',6,'THE POST OFFICE SCANDAL','1999–2024','monitor',
 'Postmasters were prosecuted for "missing" money','The shortfalls came from faults in the Horizon computer system (Fujitsu)','Court of Appeal (Apr 2021): evidence withheld · 39 convictions quashed','May 2024 law quashed convictions · 900+ wrongly convicted (est.)',
 ["Case sixteen. The British Post Office scandal. Between nineteen ninety nine and twenty fifteen, hundreds of local postmasters were prosecuted for missing money.",
  "The shortfalls were not theft. They were caused by faults in a computer system called Horizon, built by Fujitsu. Lives were ruined.",
  "In April twenty twenty one, the Court of Appeal quashed thirty nine convictions, finding the Post Office had withheld evidence showing that it and Fujitsu knew Horizon was not producing accurate records.",
  "In May twenty twenty four, Parliament passed a law quashing the convictions automatically. By estimates, more than nine hundred people were wrongly convicted, about seven hundred of them prosecuted by the Post Office."]),
]
# rapid-fire rounds: id, ch, [(title,year,icon,verdict,line1,line2,narration)]
R=[
('u04',1,[
 ('HUMAN RADIATION EXPERIMENTS','1940s','radiation','CONFIRMED','Plutonium injected into 18 patients','A presidential committee confirmed it · apology 1995',"Rapid fire. In the nineteen forties, doctors injected plutonium into eighteen hospital patients without their knowledge. A presidential committee confirmed it, and in nineteen ninety five, President Clinton apologized."),
 ('OPERATION SEA-SPRAY','1950','germ','CONFIRMED','Navy sprayed bacteria over San Francisco','A patient who got the infection died · his family sued',"In September nineteen fifty, the Navy sprayed bacteria over San Francisco to test how germs would spread. A hospital patient who developed the infection died, and his family sued."),
 ('POISONED ALCOHOL','1926–1933','bottle','CONFIRMED','Industrial alcohol made deliberately more toxic','Estimates: ≈ 10,000+ deaths (disputed count)',"In nineteen twenty six, to stop bootleggers, the federal government required industrial alcohol to be made more poisonous. Estimates of the deaths run to ten thousand or more."),
 ('OPERATION PAPERCLIP','1945–1959','rocket','CONFIRMED','1,600+ German scientists brought to the US','Some records whitewashed to hide Nazi ties',"After the war, the United States brought more than sixteen hundred German scientists and engineers to work for it, and some records were whitewashed to hide Nazi ties.")]),
('u07',2,[
 ('THE PENTAGON PAPERS','1971','papers','CONFIRMED','Secret study: officials misled the public on Vietnam','NY Times published it · Supreme Court allowed it (6–3)',"A secret government study of Vietnam showed that officials had misled the public. The New York Times published it in June nineteen seventy one, and the Supreme Court said it could."),
 ('THE INCUBATOR STORY','1990','megaphone','CONFIRMED','A 15-year-old told Congress of babies thrown from incubators','Later: the Kuwaiti ambassador\'s daughter, coached by a PR firm',"A fifteen year old girl told Congress that Iraqi soldiers pulled babies from incubators. Later reporting found she was the Kuwaiti ambassador's daughter, coached by a PR firm, and Kuwaiti doctors denied the story."),
 ('THE LAVON AFFAIR','1954','bomb','CONFIRMED','Israeli intelligence ran false-flag bombings in Egypt','Exposed · defense minister resigned · agents honored 2005',"In nineteen fifty four, Israeli intelligence recruited Egyptian Jews to bomb Western targets in Egypt, to be blamed on Egyptians. It was exposed, and surviving agents were honored in two thousand five."),
 ('THE BUSINESS PLOT','1933–34','dollar','PARTLY CONFIRMED','Gen. Smedley Butler: businessmen sought a coup against FDR','Committee: attempts were "discussed, planned" · no prosecutions',"Marine General Smedley Butler told Congress that businessmen asked him to lead a coup against Roosevelt. A congressional committee said such attempts were discussed and planned, though no one was prosecuted, and historians still debate how serious it was.")]),
('u13',4,[
 ('CIA & THE PRESS','1970s','pen','PARTLY CONFIRMED','Church Committee: ≈ 50 journalists had secret CIA ties','"Operation Mockingbird" name is later · extent debated',"A Senate committee found around fifty journalists had secret relationships with the CIA. The name Operation Mockingbird came later, and the full extent is still debated."),
 ('OPERATION GLADIO','1990','sword','PARTLY CONFIRMED','Secret NATO-linked stay-behind armies in Western Europe','Italy confirmed it in 1990 · terror ties disputed',"Secret NATO-linked stay-behind armies existed across Western Europe. Italy's prime minister confirmed its Gladio network in nineteen ninety. Allegations of ties to terrorism remain disputed."),
 ('PLOTS TO KILL CASTRO','1960–1965','target','CONFIRMED','Church Committee: at least 8 CIA plots','Some involved the Mafia',"The Church Committee found at least eight CIA plots to kill Fidel Castro between nineteen sixty and nineteen sixty five, some involving the Mafia."),
 ('OPERATION POPEYE','1967–1972','cloud','CONFIRMED','US seeded clouds to extend the Vietnam monsoon','Denied, exposed 1971–72 · later banned by treaty',"From nineteen sixty seven to nineteen seventy two, the U.S. seeded clouds over Vietnam to extend the monsoon on the Ho Chi Minh Trail. It was denied, then exposed, and environmental warfare was later banned by treaty.")]),
('u20',5,[
 ('DUPONT & PFAS','1950s–2017','drop','CONFIRMED','Internal studies showed health risks of C8 (Teflon)','Class action ≈ 70,000 residents · science panel',"Internal studies showed DuPont knew about health effects of C8, a chemical used in Teflon, long before the public did. Lawyer Robert Bilott's case led to a class action for about seventy thousand residents, and a science panel that linked it to disease."),
 ('THE RADIUM GIRLS','1920s','clock','CONFIRMED','Dial painters sickened · company blamed other causes','5 women sued · settled 1928',"In the nineteen twenties, young women painting watch dials with radium paint got sick. The company denied radium was to blame. Five women sued, and the case was settled in nineteen twenty eight."),
 ('THE PHOEBUS CARTEL','1924','bulb','CONFIRMED','Lightbulb makers agreed a 1,000-hour target life','Fines for bulbs that lasted longer (reported)',"In nineteen twenty four, major lightbulb makers formed a cartel in Geneva and agreed on a one thousand hour target life for bulbs, with fines for makers whose bulbs lasted longer."),
 ('THE LIBOR SCANDAL','2005–2012','bank','CONFIRMED','Banks submitted false interest-rate figures','Barclays ≈ $453 M (2012) · others paid billions',"From two thousand five, banks submitted false interest rate figures to benefit their traders. Barclays paid about four hundred and fifty three million dollars in two thousand twelve, and other banks paid billions more.")]),
('u22',6,[
 ('CAMBRIDGE ANALYTICA','2018','network','CONFIRMED','Data on ≈ 87 M Facebook users harvested','FTC: $5 B penalty (2019)',"Data on about eighty seven million Facebook users was harvested without their explicit consent. In twenty nineteen, Facebook agreed to a five billion dollar penalty with the FTC."),
 ('PHONE HACKING','2011','phone2','CONFIRMED','News of the World hacked phones incl. Milly Dowler','Paper closed July 2011 · Coulson convicted 2014',"Reporters hacked phones, including the voicemail of the murdered schoolgirl Milly Dowler. The paper closed in July twenty eleven, and former editor Andy Coulson was convicted in twenty fourteen."),
 ('HILLSBOROUGH','1989–2016','candle','CONFIRMED','Police altered ≥ 116 witness statements, blamed fans','2016 inquest: 96 unlawfully killed',"After the nineteen eighty nine Hillsborough disaster, police altered at least a hundred and sixteen witness statements and blamed fans. In twenty sixteen, an inquest jury found that ninety six people were unlawfully killed.")]),
]
INTRO=[
('u00',["You have probably heard the phrase, that's just a conspiracy theory. Sometimes it is. But sometimes the people laughing were wrong.",
 "In this film, we go through thirty five documented cases where the secret was real. Cases confirmed by court rulings, declassified files, official investigations, or by the people who did it.",
 "Not every case is as clean as the others. Where the evidence is disputed, I will tell you. Let's start with the rules."]),
('u01',["First, the rules. A claim goes in this film only if it was confirmed in one of three ways. A court ruling or official investigation. Declassified government documents. Or an insider, a confession, or internal records from the people involved.",
 "Not a video. Not a hunch. Not an anonymous post.",
 "And one honest limit. No film can include literally every case that has ever existed. But these thirty five are among the best documented, and for each one, I will tell you how it was proven."]),
]
OUTRO=[
('u23',["Now the other side. Some famous theories did not come true, and it matters to say so.",
 "The Apollo moon landings happened, and independent evidence backs it, including mirrors left on the Moon that observatories still bounce lasers off. Large studies, including one of more than six hundred thousand children, found no link between vaccines and autism. The Earth is not flat. And Sandy Hook was real.",
 "What separates these from the real cases? The real cases have documents, court records, named insiders, and money trails. The false ones usually have none of those, only a story."]),
('u24',["So how can you tell? In twenty sixteen, physicist David Grimes published a model of how long conspiracies can stay hidden. His estimate for faking the moon landing, which would involve hundreds of thousands of people, was that it would have been exposed within a few years.",
 "The real conspiracies in this film were small, with a few powerful people, and strong reasons to keep quiet. And they still leaked, through insiders, journalists, and paperwork.",
 "Five questions to ask. How many people would have to stay silent? For how long? Is there a document, a court case, or a named insider? Who benefits? And what evidence would prove it wrong?"]),
('u25',["Three lessons. One. Powerful institutions hide things when exposure costs them money or reputation. Two. Secrets usually come out through insiders, journalists, and documents, not through vibes. Three. Skepticism cuts both ways. Doubt power, and doubt the stories that have no proof.",
 "If this was useful, tell me in the comments which case surprised you most, and which one you want a full film on."]),
('uend',["Trust evidence. Not tone."]),
]
def build():
    scenes=[]
    scenes.append({'id':'u00','lead':1.0,'lines':INTRO[0][1]})
    scenes.append({'id':'u01','lines':INTRO[1][1]})
    global order
    order=['u02','u03','u04','u05','u06','u07','u08','u09','u10','u11','u12','u13','u14','u15','u16','u17','u18','u19','u20','u21','u22']
    dm={d[0]:d for d in D};rm={r[0]:r for r in R}
    for k in order:
        if k in dm: scenes.append({'id':k,'lines':dm[k][9]})
        else: scenes.append({'id':k,'lines':[x[6] for x in rm[k][2]]})
    for k,l in OUTRO:
        sc={'id':k,'lines':l}
        if k=='uend':sc['min']=9
        scenes.append(sc)
    return {'gap':0.5,'lead':0.7,'tail':0.9,'scenes':scenes}
if __name__=='__main__':
    j=build();dm={d[0]:d for d in D};rm={r[0]:r for r in R};json.dump(j,open('/home/user/neon-reaper/youtube/dark/conspiracy.json','w'),indent=1)
    w=sum(len(l.split()) for s in j['scenes'] for l in s['lines']);print(len(j['scenes']),'scenes',w,'words')
    # JS data for visuals
    cases=[]
    n=0
    for k in order:
        if k in dm:
            d=dm[k];n+=1;cases.append(dict(id=k,type='D',no=n,ch=d[1],title=d[2],years=d[3],icon=d[4],f1=d[5],f2=d[6],proof=d[7],out=d[8]))
        else:
            r=rm[k];items=[]
            for it in r[2]:
                n+=1;items.append(dict(no=n,title=it[0],years=it[1],icon=it[2],verdict=it[3],a=it[4],b=it[5]))
            cases.append(dict(id=k,type='R',ch=r[1],items=items))
    open('/tmp/cc/p80.js','w').write('const CCASES='+json.dumps(cases)+';\nconst CCCH='+json.dumps(CH)+';\n')
    print('cases total',n)
