const EPISODES_PAGE_QUERY = `
	query {
    first: episodes(first: 1) {
      id
      title
      image {
        url
      }
      audio: audioFile {
        url
        mime: mimeType
      }
    }

    previous: episodes(skip: 1) {
      id
      date: publishedAt
      title
      image {
        url
      }
    }
  }
`;


const SINGLE_EPISODE_PAGE_QUERY = `
	query($id: ID) {
    episode(where: { id: $id }) {
      number: episodeNumber
      date: publishedAt
      title
      description
      notes: showNotes
      audio: audioFile {
        url
        mime: mimeType
      }
      image {
        url
      }
      guests {
        fullName
        photo {
          url
        }
      }
      tags {
        name
      }
      sponsors {
        company {
          name
          website
        }
      }
    }
  }
`;


const SINGLE_EPISODE_NEIGHBORS_QUERY = `
	query($previous: Int, $next: Int) {
    previous: episode(where: { episodeNumber: $previous }) { id }
    next: episode(where: { episodeNumber: $next }) { id }
  }
`;


const GUESTS_PAGE_QUERY = `
  query {
   peoples {
    fullName
    photo {
      url
    }
    episodes: appearedOn {
      id
      date: publishedAt
      title
      image {
        url
      }
    }
  }
 }
`;


const TOPICS_PAGE_QUERY = `
	query {
    tags {
      name
      episodes {
        id
        date: publishedAt
        title
        image {
          url
        }
      }
    }
  }
`;


const RESOURCES_PAGE_QUERY = `
	query {
     assets {
      fileName
      mimeType
      url
    }
  }
`;


const SPONSORS_PAGE_QUERY = `
	query {
    sponsorships {
      company {
        name
      }
      episodes {
        id
        date: publishedAt
        title
        image {
          url
        }
      }
    }
  }
`;


const gqlQuery = async (query, variables) => {
  const response = await fetch(
    "https://api-us-east-1.graphcms.com/v2/ckll20qnkffe101xr8m2a7m2h/master",
    {
      method: "POST",
      body: JSON.stringify({ query, variables })
    }
  );

  if (!response || !response.ok) {
    throw new Error("Query failed");
  }

  const { data } = await response.json()
  return data;
};


const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]


const convertToPrettyDate = (dateString) => {
  const dateObj = new Date(dateString)
  const day = dateObj.getDate();
  const month = MONTHS[dateObj.getMonth() - 1];
  const year = dateObj.getFullYear()

  return `${day} ${month} ${year}`;
}


const createHeroBlock = (props) => {
  const {
    imageUrl,
    title,
    subtitle,
    file,
    mime,
    buttons = [],
  } = props;

  if (!imageUrl || !title) {
    throw new Error('No "imageUrl" and/or "title" values supplied');
  }

  const audioHtml = !(file || mime) ? '' : `
    <audio class="hero__player" controls="controls"> 
      <source src="${encodeURI(file)}" type="${mime}"/>
    </audio>
  `;

  const subtitleHtml = !subtitle ? '' : `
    <span class="hero__subtitle">
      ${subtitle}
    </span>
  `;

  const buttonsHtml = (buttons.length < 1) ? '' : `
	  <div class="hero__buttons-area">
      ${
    buttons.map(
      ({ label, link = '', disabled }) => `
						<${disabled ? 'span' : 'a'} 
							class="hero__button ${disabled ? 'hero__button_disabled' : ''}" 
							href="${encodeURI(link)}"
						>
							${label}
						</${disabled ? 'span' : 'a'}>
				  `
    ).join('')
    }
    </div>
  `

  return `
    <div class="hero">
      <img 
				class="hero__image" 
				src="${encodeURI(imageUrl)}"
			>

      <div class="hero__content">
				${subtitleHtml}
        <h2 class="hero__title">${title.replace(/\# /i, '')}</h2>
				${audioHtml}
        ${buttonsHtml}
      </div>
    </div>
  `
}

const createCardsGridBlock = (props) => {
  const { cards } = props;

  if (!cards || cards.length < 1) {
    throw new Error('No cards supplied')
  }

  return `
		<ul class="cards">
			${
    cards.map(({ title, subtitle, imageUrl, linkLabel, linkUrl }) => {
      if (!title) {
        throw new Error('No "title" value supplied')
      }

      const linkHtml = !(linkLabel || linkUrl) ? '' :
        `<a class="cards__button" href="${linkUrl}">${linkLabel}</a>`

      const subtitleHtml = !subtitle ? '' :
        `<span class="cards__subtitle">${subtitle}</span>`

      const imageHtml = !imageUrl ? '' :
        `<img class="cards__image" src="${imageUrl}">`

      return `
						<li class="cards__wrap">
	            <section class="cards__item">
		             ${imageHtml}
	              <div class="cards__content">
		               ${subtitleHtml}
	                <h3 class="cards__title">${title}</h3>
		              ${linkHtml}
	              </div>
	            </section>
	          </li>
					`
    }).join('')
    }
		</ul>
	`
}


const createDetailsBlock = (props) => {
  const { markdown, list = [] } = props;

	if (list.length > 0) {
	  return `
				<ul class="details">
					${list.map(item => `<li>${item}<li>`).join('')}
				</ul>
		`
	}

  return `
			<div class="details">
				${markdownit({ html: true }).render(markdown)}
			</div>
	`
}


const createDividerBlock = (props) => {
  const { title, imageUrl } = props;

  const imageHtml = !imageUrl ? '' : `<img class="divider__image" src="${imageUrl}"/>`

  return `
		<div class="divider">
      <div class="diver__content"> 
        <h2 class="divider__title">${title}</h2>
        ${imageHtml}
      </div>
    </div>
  `
}


const createEpisodesPage = async () => {
  const { first: [latest], previous } = await gqlQuery(EPISODES_PAGE_QUERY)

  const dividerHtml = createDividerBlock({ title: 'Previous Episodes' })

  const heroHtml = createHeroBlock({
    imageUrl: latest.image.url,
    title: latest.title.replace(/\# /i, ''),
    subtitle: 'Latest Episode',
    file: latest.audio.url,
    mime: latest.audio.mime,
    buttons: [{
      link: `#/id/${latest.id}`,
      label: 'View Episode',
    }],
  });

  const cardsHtml = createCardsGridBlock({
    cards: previous.map(item => ({
      title: item.title.replace(/\# /i, ''),
      subtitle: convertToPrettyDate(item.date),
      imageUrl: item.image.url,
      linkLabel: 'View Episode',
      linkUrl: `#/id/${item.id}`,
    })),
  });

  return `
		${heroHtml}
		${dividerHtml}
		${cardsHtml}
  `
}


const createGuestsPage = async () => {
  const { peoples } = await gqlQuery(GUESTS_PAGE_QUERY)

  const heroHtml = createHeroBlock({
    title: 'Guests',
    imageUrl: 'https://images.unsplash.com/photo-1460058418905-d61a1b4a55fe',
  })

  const guestHtml = peoples
    .filter(({ episodes: { length } }) => length > 0)
    .map(
      ({ fullName, episodes, photo: { url: imgageUrl } }) => {
        const dividerHtml = createDividerBlock({ title: fullName, imgageUrl })

        const cardHtml = createCardsGridBlock({
          cards: episodes.map(item => ({
            title: item.title.replace(/\# /i, ''),
            subtitle: convertToPrettyDate(item.date),
            imageUrl: item.image.url,
            linkLabel: 'View Episode',
            linkUrl: `#/id/${item.id}`,
          }))
        });

        return `
					${dividerHtml}
					${cardHtml}
				`
      }
    ).join('')

  return `
			${heroHtml}
		  ${guestHtml}
		`
}


const createTopicsPage = async () => {
  const { tags } = await gqlQuery(TOPICS_PAGE_QUERY)

  const heroHtml = createHeroBlock({
    title: 'Topics',
    imageUrl: 'https://images.unsplash.com/photo-1460058418905-d61a1b4a55fe',
  })

  const topicsHtml = tags.map(({ name, episodes }) => {
    const dividerHtml = createDividerBlock({ title: name });

    const cardsHtml = createCardsGridBlock({
      cards: episodes.map(item => ({
        title: item.title.replace(/\# /i, ''),
        imageUrl: item.image.url,
        subtitle: convertToPrettyDate(item.date),
        linkLabel: 'View Episode',
        linkUrl: `#/id/${item.id}`,
      })),
    });

    return `
			${dividerHtml}
			${cardsHtml}
		`
  }).join('')

  return `
		${heroHtml}
		${topicsHtml}
	`
}


const createResourcesPage = async () => {
  const { assets } = await gqlQuery(RESOURCES_PAGE_QUERY)
  const dividerHtml = createDividerBlock({ title: 'Files' })

  const heroHtml = createHeroBlock({
    title: 'Resources',
    imageUrl: 'https://images.unsplash.com/photo-1460058418905-d61a1b4a55fe',
  })

  const cardsHtml = createCardsGridBlock({
    cards: assets.map(item => ({
      title: item.fileName,
      subtitle: item.mimeType,
      linkLabel: 'View File',
      linkUrl: item.url,
    })),
  })

  return `
		${heroHtml}
		${dividerHtml}
		${cardsHtml}
	`
}


const createSponsorsPage = async () => {
  const { sponsorships } = await gqlQuery(SPONSORS_PAGE_QUERY)

  const heroHtml = createHeroBlock({
    title: 'Sponsors',
    imageUrl: 'https://images.unsplash.com/photo-1460058418905-d61a1b4a55fe',
  })

  const sponsorsHtml = sponsorships.map(({ company: { name }, episodes }) => {
    const dividerHtml = createDividerBlock({ title: name });

    const cardsHtml = createCardsGridBlock({
      cards: episodes.map(item => ({
        title: item.title.replace(/\# /i, ''),
        imageUrl: item.image.url,
        subtitle: convertToPrettyDate(item.date),
        linkLabel: 'View Episode',
        linkUrl: `#/id/${item.id}`,
      })),
    });

    return `
			${dividerHtml}
			${cardsHtml}
		`
  }).join('')

  return `
    ${heroHtml}
    ${sponsorsHtml}
  `
}


const createSingleEpisodePage = async (value) => {
  const {
    episode: {
      title,
      date,
      description,
      number,
      notes,
      guests = [],
      tags = [],
      sponsors = [],
      audio: { url, mime },
      image: { url: imageUrl },
    }
  } = await gqlQuery(SINGLE_EPISODE_PAGE_QUERY, { id: value })

  const {
    previous,
    next,
  } = await gqlQuery(SINGLE_EPISODE_NEIGHBORS_QUERY, { previous: number + 1, next: number - 1 })

  const heroHtml = createHeroBlock({
    imageUrl: imageUrl,
    title: title.replace(/\# /i, ''),
    subtitle: convertToPrettyDate(date),
    file: url,
    mime: mime,
    buttons: [previous, next].map((button, index) => ({
      label: index === 0 ? '◄ Previous Episode' : ' Next Episode ►',
      link: !button ? '' : `#/id/${button.id}`,
      disabled: !button,
    })),
  });

  const guestHtml = guests.length < 1 ? '' : createCardsGridBlock({
    cards: guests.map(item => ({
      title:  item.fullName,
      imageUrl: item.photo.url,
    }))
  })

  const descriptionHtml = !description ? '' : `
		${createDividerBlock({ title: 'Description' })}
		${createDetailsBlock({ markdown: markdownit().render(description) })}
	`

  const topicsHtml = tags.length < 1 ? '' : `
		${createDividerBlock({ title: 'Topics' })}
		${createDetailsBlock({ list: tags.map(({ name }) => name) })}
	`

  const sponsorsHtml = sponsors.length < 1 ? '' : `
		${createDividerBlock({ title: 'Sponsors' })}
		${createDetailsBlock({ list: sponsors.map(({ company }) => company.name) })}
	`

  const notesHtml = !description ? '' : `
		${createDividerBlock({ title: 'Show Notes' })}
		${createDetailsBlock({ markdown: markdownit().render(notes) })}
	`

  return `
		${heroHtml}
		${descriptionHtml}
    ${createDividerBlock({ title: 'Guests' })}
		${guestHtml}
		${topicsHtml}
		${sponsorsHtml}
		${notesHtml}
	`
}

const appNode = document.querySelector('#app');
const navigateNode = document.querySelector('#navigate');
const menuApp = document.querySelector('#menu');

let navigating = false;

const toggleNavigate = (state) => {
  navigateNode.classList.toggle('header__navigate_active')
  menuApp.classList.toggle('header__menu_active')
  navigate = state === undefined ? !navigate : state;
}

const handleRouting = async () => {
  const { hash } = window.location
  appNode.innerHTML = '<span class="loader"></span>'

  const [page, id] = hash
    .replace(/^#\//, '')
    .replace(/\/$/, '')
    .split('/')

  menuApp 
    .querySelectorAll('a')
    .forEach(node => {
      const value = node.innerText.toLowerCase();
    
      if (value === page || (!hash && value === 'episodes')) {
        node.classList.add('header__button_disabled')
      } else {
        node.classList.remove('header__button_disabled')
      }
  })

  const routesMap = {
    episodes: () => createEpisodesPage(),
    topics: () => createTopicsPage(),
    guests: () => createGuestsPage(),
    resources: () => createResourcesPage(),
    sponsors: () => createSponsorsPage(),
    id: (id) => createSingleEpisodePage(id),
  }

	const routeFn = routesMap[page || 'episodes'];
	appNode.innerHTML = await routeFn(id || null);

  if (menuApp.classList.contains('header__menu_active')) {
    toggleNavigate(false)
  }
}

handleRouting();
window.addEventListener('hashchange', handleRouting);
navigateNode.addEventListener('click', toggleNavigate)