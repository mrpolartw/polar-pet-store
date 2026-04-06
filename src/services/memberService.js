import {
  getMember as getMemberApi,
  updateMember as updateMemberApi,
  getAddresses as getAddressesApi,
  createAddress as createAddressApi,
  updateAddress as updateAddressApi,
  deleteAddress as deleteAddressApi,
  getPets as getPetsApi,
  createPet as createPetApi,
  updatePet as updatePetApi,
  deletePet as deletePetApi,
  getPoints as getPointsApi,
  getTiers as getTiersApi,
} from '../api/memberApi'

export const POINT_CHANGE_TYPE_LABELS = {
  earn_order: '消費回饋',
  earn_welcome: '加入贈點',
  earn_birthday: '生日贈點',
  earn_event: '活動贈點',
  earn_manual: '人工加點',
  redeem_order: '訂單折抵',
  deduct_manual: '人工扣點',
  deduct_expire: '點數到期',
  deduct_cancel: '訂單取消',
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toString = (value) => (value == null ? '' : String(value))
const toBoolean = (value) => value === true || value === 1 || value === '1'

export const normalizeMember = (member = {}) => {
  const normalized = {
    ...member,
    id: toNumber(member.id, member.id ?? 0),
    wp_user_id: toNumber(member.wp_user_id, 0),
    tier_id: toNumber(member.tier_id, 0),
    cashback_rate: toNumber(member.cashback_rate, 0),
    points_balance: toNumber(member.points_balance, 0),
    points_lifetime: toNumber(member.points_lifetime, 0),
    yearly_spending: toNumber(member.yearly_spending, 0),
    total_spending: toNumber(member.total_spending, 0),
    display_name: toString(member.display_name),
    first_name: toString(member.first_name),
    last_name: toString(member.last_name),
    email: toString(member.email),
    phone: toString(member.phone),
    gender: toString(member.gender),
    birthday: toString(member.birthday),
    avatar_url: toString(member.avatar_url),
    tier_key: toString(member.tier_key),
    tier_name: toString(member.tier_name),
    tier_color: toString(member.tier_color),
    status: toString(member.status),
    registered_at: toString(member.registered_at),
    name: toString(member.display_name),
    avatar: toString(member.avatar_url),
    points: toNumber(member.points_balance, 0),
    pointsLifetime: toNumber(member.points_lifetime, 0),
    yearlySpending: toNumber(member.yearly_spending, 0),
    totalSpending: toNumber(member.total_spending, 0),
    lineLinked: Boolean(member.line_user_id),
  }

  return normalized
}

export const mapMemberToAuthUser = (member, previousUser = {}) => {
  const normalized = normalizeMember(member)

  return {
    ...previousUser,
    id: normalized.id,
    memberId: normalized.id,
    wpUserId: normalized.wp_user_id,
    name: normalized.display_name || previousUser.name || '',
    firstName: normalized.first_name || previousUser.firstName || '',
    lastName: normalized.last_name || previousUser.lastName || '',
    email: normalized.email || previousUser.email || '',
    phone: normalized.phone || previousUser.phone || '',
    gender: normalized.gender || previousUser.gender || '',
    birthday: normalized.birthday || previousUser.birthday || '',
    avatar: normalized.avatar_url || previousUser.avatar || '',
    points: normalized.points_balance,
    pointsLifetime: normalized.points_lifetime,
    yearlySpending: normalized.yearly_spending,
    totalSpending: normalized.total_spending,
    tierId: normalized.tier_id,
    tierKey: normalized.tier_key || previousUser.tierKey || '',
    tierName: normalized.tier_name || previousUser.tierName || '',
    tierColor: normalized.tier_color || previousUser.tierColor || '',
    cashbackRate: normalized.cashback_rate,
    status: normalized.status || previousUser.status || '',
    registeredAt: normalized.registered_at || previousUser.registeredAt || '',
    lineLinked: normalized.lineLinked || previousUser.lineLinked || false,
    lineDisplayName: previousUser.lineDisplayName || '',
    lineBoundAt: previousUser.lineBoundAt || '',
    member: normalized,
  }
}

export const serializeMemberUpdate = (updates = {}) => {
  const payload = {}

  if (Object.prototype.hasOwnProperty.call(updates, 'display_name') || Object.prototype.hasOwnProperty.call(updates, 'name')) {
    payload.display_name = toString(updates.display_name ?? updates.name).trim()
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'phone')) {
    payload.phone = toString(updates.phone).trim()
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'gender')) {
    payload.gender = toString(updates.gender).trim()
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'birthday')) {
    payload.birthday = toString(updates.birthday).trim()
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'avatar_url') || Object.prototype.hasOwnProperty.call(updates, 'avatar')) {
    payload.avatar_url = toString(updates.avatar_url ?? updates.avatar).trim()
  }

  return payload
}

export const normalizeAddress = (address = {}) => {
  const isDefault = toBoolean(address.is_default ?? address.isDefault)
  const storeType = toString(address.store_type ?? address.storeType)
  const storeId = toString(address.store_id ?? address.storeId)
  const storeName = toString(address.store_name ?? address.storeName)
  const type = storeType || storeId || storeName ? '711' : 'home'

  return {
    ...address,
    id: toNumber(address.id, address.id ?? 0),
    member_id: toNumber(address.member_id, 0),
    label: toString(address.label),
    recipient_name: toString(address.recipient_name ?? address.name),
    phone: toString(address.phone),
    postal_code: toString(address.postal_code ?? address.postalCode),
    city: toString(address.city),
    district: toString(address.district),
    address: toString(address.address),
    is_default: isDefault,
    store_type: storeType,
    store_id: storeId,
    store_name: storeName,
    memberId: toNumber(address.member_id, 0),
    type,
    name: toString(address.recipient_name ?? address.name),
    postalCode: toString(address.postal_code ?? address.postalCode),
    isDefault,
    storeType,
    storeId,
    storeName,
  }
}

export const serializeAddress = (address = {}) => {
  const type = toString(address.type) || ((address.store_type || address.store_name || address.store_id || address.storeType || address.storeName || address.storeId) ? '711' : 'home')
  const isStore = type === '711'

  return {
    label: toString(address.label).trim(),
    recipient_name: toString(address.recipient_name ?? address.name).trim(),
    phone: toString(address.phone).trim(),
    postal_code: toString(address.postal_code ?? address.postalCode).trim(),
    city: isStore ? '' : toString(address.city).trim(),
    district: isStore ? '' : toString(address.district).trim(),
    address: isStore ? '' : toString(address.address).trim(),
    is_default: Boolean(address.is_default ?? address.isDefault),
    store_type: isStore ? toString((address.store_type ?? address.storeType) || '7-11').trim() : '',
    store_id: isStore ? toString(address.store_id ?? address.storeId).trim() : '',
    store_name: isStore ? toString(address.store_name ?? address.storeName).trim() : '',
  }
}

export const normalizePet = (pet = {}) => ({
  ...pet,
  id: toNumber(pet.id, pet.id ?? 0),
  member_id: toNumber(pet.member_id, 0),
  pet_uid: toString(pet.pet_uid ?? pet.petUid),
  name: toString(pet.name ?? pet.petName),
  type: toString(pet.type ?? pet.petType),
  breed: toString(pet.breed ?? pet.petBreed),
  gender: toString(pet.gender ?? pet.petGender),
  birthday: toString(pet.birthday ?? pet.petBirthday),
  age: pet.age === '' || pet.age == null ? '' : toString(pet.age ?? pet.petAge),
  weight: pet.weight === '' || pet.weight == null ? '' : toString(pet.weight ?? pet.petWeight),
  avatar_url: toString(pet.avatar_url ?? pet.petAvatarUrl),
  note: toString(pet.note ?? pet.petNote),
  memberId: toNumber(pet.member_id, 0),
  petUid: toString(pet.pet_uid ?? pet.petUid),
  petName: toString(pet.name ?? pet.petName),
  petType: toString(pet.type ?? pet.petType),
  petBreed: toString(pet.breed ?? pet.petBreed),
  petGender: toString(pet.gender ?? pet.petGender),
  petBirthday: toString(pet.birthday ?? pet.petBirthday),
  petAge: pet.age === '' || pet.age == null ? '' : toString(pet.age ?? pet.petAge),
  petWeight: pet.weight === '' || pet.weight == null ? '' : toString(pet.weight ?? pet.petWeight),
  petAvatarUrl: toString(pet.avatar_url ?? pet.petAvatarUrl),
  petNote: toString(pet.note ?? pet.petNote),
})

export const serializePet = (pet = {}) => ({
  pet_uid: toString(pet.pet_uid ?? pet.petUid).trim(),
  name: toString(pet.name ?? pet.petName).trim(),
  type: toString(pet.type ?? pet.petType).trim(),
  breed: toString(pet.breed ?? pet.petBreed).trim(),
  gender: toString(pet.gender ?? pet.petGender).trim(),
  birthday: toString(pet.birthday ?? pet.petBirthday).trim(),
  age: pet.age === '' || pet.age == null
    ? (pet.petAge === '' || pet.petAge == null ? null : toNumber(pet.petAge, 0))
    : toNumber(pet.age, 0),
  weight: pet.weight === '' || pet.weight == null
    ? (pet.petWeight === '' || pet.petWeight == null ? null : toNumber(pet.petWeight, 0))
    : toNumber(pet.weight, 0),
  avatar_url: toString(pet.avatar_url ?? pet.petAvatarUrl).trim(),
  note: toString(pet.note ?? pet.petNote).trim(),
})

export const normalizePoints = (points = {}) => ({
  balance: toNumber(points.balance, 0),
  lifetime: toNumber(points.lifetime, 0),
  logs: Array.isArray(points.logs)
    ? points.logs.map((row) => ({
      ...row,
      id: toNumber(row.id, row.id ?? 0),
      points_delta: toNumber(row.points_delta, 0),
      points_after: toNumber(row.points_after, 0),
      order_id: toNumber(row.order_id, 0),
      label: POINT_CHANGE_TYPE_LABELS[row.change_type] || row.change_type || '',
    }))
    : [],
})

export const normalizeTier = (tier = {}, currentTierKey = '') => ({
  ...tier,
  id: toNumber(tier.id, tier.id ?? 0),
  sort_order: toNumber(tier.sort_order, 0),
  cashback_rate: toNumber(tier.cashback_rate, 0),
  upgrade_min_spending: toNumber(tier.upgrade_min_spending, 0),
  welcome_points: toNumber(tier.welcome_points, 0),
  birthday_bonus_rate: toNumber(tier.birthday_bonus_rate, 0),
  free_shipping_threshold: toNumber(tier.free_shipping_threshold, 0),
  isCurrent: currentTierKey !== '' && currentTierKey === tier.tier_key,
})

export const fetchMember = async (token) => normalizeMember(await getMemberApi(token))

export const updateMember = async (token, updates) => normalizeMember(
  await updateMemberApi(token, serializeMemberUpdate(updates))
)

export const fetchAddresses = async (token) => {
  const rows = await getAddressesApi(token)
  return Array.isArray(rows) ? rows.map(normalizeAddress) : []
}

export const createAddress = async (token, address) => normalizeAddress(
  await createAddressApi(token, serializeAddress(address))
)

export const updateAddress = async (token, id, address) => normalizeAddress(
  await updateAddressApi(token, id, serializeAddress(address))
)

export const deleteAddress = async (token, id) => deleteAddressApi(token, id)

export const fetchPets = async (token) => {
  const rows = await getPetsApi(token)
  return Array.isArray(rows) ? rows.map(normalizePet) : []
}

export const createPet = async (token, pet) => normalizePet(
  await createPetApi(token, serializePet(pet))
)

export const updatePet = async (token, id, pet) => normalizePet(
  await updatePetApi(token, id, serializePet(pet))
)

export const deletePet = async (token, id) => deletePetApi(token, id)

export const fetchPoints = async (token) => normalizePoints(await getPointsApi(token))

export const fetchTiers = async (currentTierKey = '') => {
  const rows = await getTiersApi()
  return Array.isArray(rows) ? rows.map((tier) => normalizeTier(tier, currentTierKey)) : []
}
