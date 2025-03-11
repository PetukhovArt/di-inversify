import {Container, ContainerModule, injectable, ServiceIdentifier} from 'inversify';
import {makeAutoObservable} from 'mobx';
import {observer} from 'mobx-react-lite';
import {createContext, ReactNode, useContext, useMemo, useState} from 'react';


// Абстракция
@injectable()
abstract class Weapon {
	abstract damage: number
}

@injectable()
class Katana extends Weapon {
	public damage = 10;
}

@injectable()
class AdmiralSword extends Weapon {
	public damage = 12;
}

@injectable()
class Ninja {
	constructor(
		public readonly katana: Weapon,
	) {
	}

	shot() {
		console.log('shot', this.katana.damage)
	}
}

// Абстракция


const container = new Container();

container.bind(Ninja).toSelf();
container.bind(Katana).toSelf();
container.bind(AdmiralSword).toSelf();
container.bind(Weapon).to(AdmiralSword)

const ninja = container.get(Ninja);

console.log(ninja.shot())


// infrastructure
@injectable()
abstract class Window {
	abstract id: string;

	abstract onLoad(): void
}

@injectable()
class MainWindow extends Window {
	id = 'main-window'

	onLoad(): void {
		console.log('main window')
	}
}

@injectable()
class TreeWindow extends Window {
	id = 'tree-window'

	onLoad(): void {
		console.log('tree window')
	}
}


container.bind(Window).to(MainWindow)
container.bind(Window).to(TreeWindow)


// новая оконная инфраструктура
const allWindows = container.getAll(Window);

const open = (id: string) => {
	const w = allWindows.find(w => w.id === id)
	console.log(w)

	if (w) {
		w.onLoad();
	}
}

open('main-window')


// modules

// shared


// lib/ioc
const ContainerContext = createContext<Container | null>(null);

const useIoc = () => {
	const container = useContext(ContainerContext)

	if (!container) {
		throw new Error('use should use ioc under IocProvider')
	}
	return container
}

const useInstance = <T, >(key: ServiceIdentifier<T>) => {
	const ioc = useIoc();
	return useMemo(() => {
		return ioc.get(key)
	}, [ioc, key])
}

const IocProvider = ({
											 container,
											 children
										 }: {
	container: Container,
	children: React.ReactNode
}) => {
	return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>
}

// lib/window

@injectable()
abstract class WindowWidget {
	abstract render(): ReactNode
}


// entitiy weapon

@injectable()
abstract class Weapon2 {
	abstract damage: number
}

// feature katana

@injectable()
class Katana2 extends Weapon2 {
	public damage = 10;
}

@injectable()
class KatanaWidget extends WindowWidget {
	constructor(private katana: Katana2) {
		super()
	}

	render(): ReactNode {
		return <div>Katana view {this.katana.damage}</div>
	}
}


const KatanaFeatureModule = new ContainerModule((o) => {
	o.bind(KatanaWidget).toSelf()
	o.bind(WindowWidget).to(KatanaWidget)
	o.bind(Katana2).toSelf();
	o.bind(Weapon2).to(Katana2)
})


// feature ninja

@injectable()
class Ninja2 {
	constructor(
		public readonly weapon: Weapon2,
	) {
	}

	shot() {
		console.log('shot', this.weapon.damage)
	}
}

@injectable()
class NinjaWidget extends WindowWidget {
	constructor(private ninja: Ninja2) {
		super()
	}

	render(): ReactNode {
		return <div>Ninja view {this.ninja.weapon.damage}</div>
	}
}

const NinjaFeatureModule = new ContainerModule((o) => {
	o.bind(Ninja2).toSelf();
	o.bind(NinjaWidget).toSelf();
	o.bind(WindowWidget).to(NinjaWidget)
})


// feature 3

@injectable()
class SamuraiStore {
	health = 30

	constructor(private weapon: Weapon2) {
		makeAutoObservable(this)
	}

	get isDead() {
		return this.health <= 0
	}

	selfHit() {
		console.log('hit')
		this.health -= this.weapon.damage

		console.log(this.health)
	}
}

const Samurai = observer(() => {
	const store = useInstance(SamuraiStore);
	return <div>
		Samurai isDead:{store.isDead ? 'true' : 'false'}
		heath: {store.health}
		<button onClick={() => store.selfHit()}>Kill</button>
	</div>
})

const SamuraiController = observer(() => {
	const [toggle, setToggle] = useState(false)
	return <div>
		{toggle && <Samurai/>}
		<button onClick={() => setToggle(v => !v)}>toggle</button>
	</div>
})

@injectable()
class SamuraiWidget extends WindowWidget {
	render(): ReactNode {
		return <SamuraiController/>
	}
}

const SamuraiFeatureModule = new ContainerModule((o) => {
	o.bind(WindowWidget).to(SamuraiWidget)
	o.bind(SamuraiStore).toSelf().inSingletonScope()
})

// app
const container2 = new Container();
container2.load(NinjaFeatureModule)
container2.load(KatanaFeatureModule)
container2.load(SamuraiFeatureModule)
container2.get(Ninja2)


function App() {

	const widgets = container2.getAll(WindowWidget)

	// return <IocProvider container={container2}>
	// 	{widgets.map(w => w.render())}
	// </IocProvider>
	return <div className={'App'}>2232323</div>
}

export default App
