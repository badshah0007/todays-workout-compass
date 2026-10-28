<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep exercise carousel presentation in a shared component using the existing carousel controls; daily schedule selection stays in the index route so presentation changes do not alter routines.
- The Virtual Trainer skins a CC0 rigged GLB (public/models/trainer.glb) and drives its bones from an invisible guide skeleton built from trainer-data pose angles; add exercises by adding pose/focus data, not new animation files, so every move shares one rig.
