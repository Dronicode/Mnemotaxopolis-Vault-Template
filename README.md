# Mnemotaxopolis

**Mnemotaxopolis** is a personal knowledge management (PKM) system, sometimes called a 'second brain'. Beginning as an attempt to curate a well-organized collection of ideas, information, and insights, a Mnemotaxipolis can grow from just a library of notes into a personal monument of knowledge and wisdom.

The name **Mnemotaxopolis** is composed from three Greek roots:
- **Mnemo**: Derived from the word "mneme" meaning remembrance, and inspired by Mnemosyne the goddess of memory, signifying its role as a tool for recalling information.
- **Taxo**: Related to "taxonomy" from "taxis" meaning order or arrangement, reflecting the systematic organization underpinning every note and link.
- **Polis**: The concept of a city state or community, evoking the image of a project built up into a great and vibrant city where all ideas reside.

This word signifies the balance between the process of gathering information and the art of organizing it, forming a sanctuary where all that is thought and learned is recorded and remembered which may grow to the scale of a great city.
## Background
While several popular PKM methodologies already exist, two in particular are most prevalent. They each have distinct strengths and weaknesses with primary intended use cases and can be adapted to other purposes but often with drawbacks. 
### The PARA Method by Tiago Forte
 A folder-based system for sorting all notes according to how actionable they are. The folders are for projects with deadlines, long-term responsibilities, other topics or interests, and archiving completed or 'inactive' items. 
- Powerful productivity focused approach that prioritizes deadlines and sorting workloads.
- Can be implemented in any file system or even physically.
- Folders are intuitive but limited. A note that is equally associated with a project and a resource can not be placed in both, meaning either it will be a resource and unavailable or indirectly linked to the project, potentially causing lost information or at least reduced accessibility.
- Archival of a project folder is sensible to avoid obscuring active tasks with other completed actions, but actual notes and information should never need to be filed away. These two concepts are too tightly coupled and should be abstracted from each other.
- Archival also is illogical because it can contain items from each of the other three folders because it is a state or condition rather than a level of being actionable like the other three and these properties are not exclusive of each other.
### The Zettelkasten method by Niklas Luhmann
An index-based system which does minimal sorting or grouping of notes themselves but gives them all unique identifiers to find them with. Notes can be referenced by multiple indexes making one-to-many relationships simple to implement. Minimal use of folders only to sort notes by permanence and by origin, with folders for Fleeting (temporary) notes, permanent notes, and lastly for notes about literature.
- Academic focused approach that lends itself well to collecting large amounts of notes of books and articles.
- Notes may be entirely unordered or ordered by date.
- Rejects categorization as a ''top down" approach for being too restrictive, uses bottom up emergent linking instead.
- Originally a physical system but is highly tedious to maintain properly without digital indexing.
- Grouping by permanence is a simple non-hierarchical system but having a separate category for notes from a particular source such as literature is illogical because the source of a piece of information has little to do with the note's permanence.
- No other form of systematization or organization without use of indexes.
### Maps of Content (MoCs) by Nick Milo
MoCs are a form of index used for creating centralized networks of information about a given topic. While an index is simply an ordered list of references, an MoC can be seen as a more informative hub of references. It isn't a system for organizing or arranging notes, but for showing relationships between them. It is very commonly used to enhance the indexes of Zettelkasten. 

Mnemotaxopolis combines each of these methodologies to address many of their weaknesses while maintaining or even enhancing their strengths. of the others, combining them into something comprehensive but not overly complicated. This is not revolutionary or the first attempt to combine the three systems above, but it does use some different twists for a new approach.
## How it works
### Structure and organization
At the top level there are two folders, one dedicated to MoCs, and one dedicated to content.

The MoC folder contains exclusively MoCs and indexes, and never any actual content. 
It contains one file, the top level index or 'map of maps' which can be used as a point of entry to find everything else. If organized and linked properly, there should be a path from here to every single note in the whole Mnemotaxopolis, and from each file back to here.
All the rest of the MoCs are organized using the PARA methodology which is the first big change implemented in this system. By sorting indexes and MoCs with PARA rather than folders of notes, it creates a level of abstraction which solves most of that system's weaknesses. It is easier to maintain a comprehensive project folder referencing all relevant notes, and notes can be easily linked to multiple projects or areas thanks to the use of linking and references. PARA's 'archive' folder has been replaced with a 'completed' folder. Only completed items from Projects or Areas are moved here for the purpose of decluttering, but there is no reason to ever archive a resource item with no deadline. 
Optionally the Archive/ Completed folder can be ignored or removed entirely. In this case, items are never moved out of their folder because of completion status. Instead their references in a MoC are sorted by completion status. This approach strongly supports the ideology of using folders for loose relational grouping and indexes for categorization and sorting.

The content folder contains all actual notes and information. 
The organizational structure for the content notes is a modified version of Zettelkasten still grouping notes by permanence with temporary (rather than fleeting) and permanent notes, but dropping the literature category for some other auxiliary groups instead. The temporary folder serves the usual purpose of containing any notes which will not be kept long-term. Additionally it is useful as a quick and simple transitory storage for notes which will be permanent but haven't been ordered yet for whatever reason. One suggested use case for this is to consider all incomplete notes as temporary until they have been completed. As the permanent collection scales up in size, having a single point where all incomplete works can be speedily located is convenient.
The permanent folder is the largest as this is where all permanent content notes are stored. Typically a flat structure is used here and the notes are either left unordered or simply ordered alphabetically or chronologically with no more folders from here, allowing tags and indexes to do and further organization. This system recommends one additional layer of folders, grouping topics by their relation to the vault's owner based on the AQAL model from Integral Theory.
Integral theory aims to be a universal metatheory in which all academic disciplines, forms of knowledge, and experiences cohesively align. It introduced the AQAL (All Quadrants All Levels) framework with a four quadrant grid with two axes, specifically the "interior-exterior" axis, and "individual-collective" axis. Each quadrant categorizes one of these four perspectives:
- **Individual interior** describes thoughts, emotions, memories, states of mind, perceptions, and immediate sensations.
- **Individual exterior** describes
- **Collective interior** describes
- **Collective exterior** describes 



01 - (MoCs & Indexes)
 01.1 - (Projects)
 01.2 - (Areas)
 01.3 - (Resources)
 01.4 - (Complete)
 Top-level-index
