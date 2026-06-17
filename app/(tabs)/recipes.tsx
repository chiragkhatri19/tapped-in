import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Recipe } from '@/components/recipes/types';
import { R } from '@/components/recipes/types';
import { SEED_RECIPES } from '@/components/recipes/seed-recipes';
import {
  loadRecipes, saveRecipes, loadVotes, saveVotes, loadSaved, saveSaved,
} from '@/components/recipes/helpers';
import RecipeFeed from '@/components/recipes/RecipeFeed';
import RecipeDetail from '@/components/recipes/RecipeDetail';
import SubmitRecipe from '@/components/recipes/SubmitRecipe';

type RecipeView = 'feed' | 'detail' | 'submit';

export default function RecipesTab() {
  const [view, setView] = useState<RecipeView>('feed');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [votes, setVotes]     = useState<Record<string, 'up' | null>>({});
  const [saved, setSaved]     = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      let r = await loadRecipes();
      if (r.length === 0) {
        await saveRecipes(SEED_RECIPES);
        r = SEED_RECIPES;
      }
      setRecipes(r);
      setVotes(await loadVotes());
      setSaved(await loadSaved());
    })();
  }, []);

  const handleVotesChange = useCallback((v: Record<string, 'up' | null>) => {
    setVotes(v);
    saveVotes(v);
  }, []);

  const handleSavedChange = useCallback((s: string[]) => {
    setSaved(s);
    saveSaved(s);
  }, []);

  const handlePostSubmit = useCallback(async (recipe: Recipe) => {
    const updated = [recipe, ...recipes];
    setRecipes(updated);
    await saveRecipes(updated);
    setView('feed');
  }, [recipes]);

  const selectedRecipe = selectedId ? recipes.find(r => r.id === selectedId) ?? null : null;

  return (
    <View style={s.root}>
      {view === 'feed' && (
        <RecipeFeed
          recipes={recipes}
          votes={votes}
          saved={saved}
          setVotes={handleVotesChange}
          setSaved={handleSavedChange}
          onOpenDetail={(id) => { setSelectedId(id); setView('detail'); }}
          onPostRecipe={() => setView('submit')}
        />
      )}
      {view === 'detail' && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          votes={votes}
          saved={saved}
          setVotes={handleVotesChange}
          setSaved={handleSavedChange}
          onBack={() => { setSelectedId(null); setView('feed'); }}
        />
      )}
      {view === 'submit' && (
        <SubmitRecipe
          onCancel={() => setView('feed')}
          onSubmit={handlePostSubmit}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: R.bg },
});
