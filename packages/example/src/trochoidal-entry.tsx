import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {TrochoidalMilling} from './TrochoidalMilling';

const Root: React.FC = () => {
	return (
		<Composition
			id="TrochoidalMilling"
			component={TrochoidalMilling}
			width={1280}
			height={720}
			fps={30}
			durationInFrames={960}
		/>
	);
};

registerRoot(Root);
