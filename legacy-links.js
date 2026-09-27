// Ссылки старой одностраничной версии продолжают вести к нужному разделу.
(() => {
  const routes = {
    overview: 'index.html', stats: 'stats.html', growth: 'growth.html',
    equipment: 'equipment.html', magic: 'magic.html', summons: 'magic.html#summons',
    origins: 'races.html#origins', pantheon: 'faith.html#pantheon',
    characters: 'characters.html', questions: 'roadmap.html',
    beshaba: 'faith.html#beshaba', 'weapon-abilities': 'combat.html#abilities'
  };
  const redirect = () => {
    const key = location.hash.slice(1);
    if (key !== 'overview' && Object.hasOwn(routes, key)) location.replace(routes[key]);
  };
  redirect();
  window.addEventListener('hashchange', redirect);
})();
